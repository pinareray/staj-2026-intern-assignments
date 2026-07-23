using Application.Common;
using Application.Interfaces;
using Application.Repositories;
using Domain.Entities;
using MediatR;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading;
using System.Threading.Tasks;

namespace Application.Features.Messages.Commands.SendMessage
{
    public class SendMessageCommandHandler : IRequestHandler<SendMessageCommand, object>
    {
        private readonly IMessageRepository _messageRepository;
        private readonly IUserRepository _userRepository;
        private readonly IChannelRepository _channelRepository;
        private readonly IChannelMemberRepository _channelMemberRepository;
        private readonly IServerRepository _serverRepository;
        private readonly INotificationRepository _notificationRepository;
        private readonly IChatNotificationService _chatNotificationService;
        private readonly IUserBlockRepository _blockRepository;

        public SendMessageCommandHandler(
            IMessageRepository messageRepository,
            IUserRepository userRepository,
            IChannelRepository channelRepository,
            IChannelMemberRepository channelMemberRepository,
            IServerRepository serverRepository,
            INotificationRepository notificationRepository,
            IChatNotificationService chatNotificationService,
            IUserBlockRepository blockRepository)
        {
            _messageRepository = messageRepository;
            _userRepository = userRepository;
            _channelRepository = channelRepository;
            _channelMemberRepository = channelMemberRepository;
            _serverRepository = serverRepository;
            _notificationRepository = notificationRepository;
            _chatNotificationService = chatNotificationService;
            _blockRepository = blockRepository;
        }

        public async Task<object> Handle(SendMessageCommand request, CancellationToken cancellationToken)
        {
            if (string.IsNullOrWhiteSpace(request.Content) &&
                string.IsNullOrWhiteSpace(request.AttachmentUrl))
            {
                throw new Exception("Mesaj içeriği boş olamaz.");
            }

            var channel = await _channelRepository.GetByIdAsync(request.ChannelId);
            if (channel == null)
            {
                throw new Exception("Kanal bulunamadı.");
            }

            if (channel.Type == "DM")
            {
                var isMember = await _channelMemberRepository.IsMemberAsync(
                    request.ChannelId,
                    request.UserId);
                if (!isMember)
                {
                    throw new Exception("Bu DM kanalına mesaj gönderme yetkiniz yok.");
                }

                var members = await _channelMemberRepository.GetByChannelIdAsync(request.ChannelId);
                var peer = members.Find(m => m.UserId != request.UserId);
                if (peer != null &&
                    await _blockRepository.IsBlockedEitherWayAsync(request.UserId, peer.UserId))
                {
                    throw new Exception("Engellenmiş bir kullanıcıyla mesajlaşamazsınız.");
                }
            }

            var message = new Message
            {
                Id = Guid.NewGuid(),
                Content = string.IsNullOrWhiteSpace(request.Content)
                    ? ""
                    : request.Content.Trim(),
                UserId = request.UserId,
                ChannelId = request.ChannelId,
                CreatedAt = DateTime.UtcNow,
                AttachmentUrl = string.IsNullOrWhiteSpace(request.AttachmentUrl)
                    ? null
                    : request.AttachmentUrl.Trim()
            };

            await _messageRepository.AddAsync(message);

            var user = await _userRepository.GetByIdAsync(request.UserId);
            var payload = new
            {
                message.Id,
                message.Content,
                message.UserId,
                Username = user?.Username ?? "Kullanıcı",
                message.ChannelId,
                message.CreatedAt,
                message.EditedAt,
                message.AttachmentUrl
            };

            await _chatNotificationService.SendMessageToChannelAsync(
                request.ChannelId.ToString(),
                payload);

            if (channel.Type == "DM")
            {
                var members = await _channelMemberRepository.GetByChannelIdAsync(request.ChannelId);
                foreach (var member in members.Where(m => m.UserId != request.UserId))
                {
                    await _chatNotificationService.NotifyDmUnreadAsync(
                        member.UserId,
                        new
                        {
                            channelId = request.ChannelId,
                            messageId = message.Id
                        });
                }
            }

            await CreateMentionNotificationsAsync(
                channel,
                message,
                request.UserId,
                user?.Username ?? "Kullanıcı");

            return payload;
        }

        private async Task CreateMentionNotificationsAsync(
            Channel channel,
            Message message,
            Guid actorUserId,
            string actorUsername)
        {
            var usernames = MentionParser.ExtractUsernames(message.Content);
            if (usernames.Count == 0)
            {
                return;
            }

            var eligibleUserIds = new HashSet<Guid>();
            if (string.Equals(channel.Type, "DM", StringComparison.OrdinalIgnoreCase))
            {
                var members = await _channelMemberRepository.GetByChannelIdAsync(channel.Id);
                foreach (var m in members)
                {
                    eligibleUserIds.Add(m.UserId);
                }
            }
            else if (channel.ServerId.HasValue)
            {
                var members = await _serverRepository.GetMembersAsync(channel.ServerId.Value);
                foreach (var m in members)
                {
                    eligibleUserIds.Add(m.UserId);
                }
            }

            var preview = message.Content.Length > 120
                ? message.Content[..117] + "..."
                : message.Content;

            var notifications = new List<Notification>();
            var notified = new HashSet<Guid>();

            foreach (var username in usernames)
            {
                var mentioned = await _userRepository.GetByUsernameAsync(username);
                if (mentioned == null) continue;
                if (mentioned.Id == actorUserId) continue;
                if (!eligibleUserIds.Contains(mentioned.Id)) continue;
                if (!notified.Add(mentioned.Id)) continue;

                var notification = new Notification
                {
                    Id = Guid.NewGuid(),
                    UserId = mentioned.Id,
                    Type = "mention",
                    ActorUserId = actorUserId,
                    ServerId = channel.ServerId,
                    ChannelId = channel.Id,
                    MessageId = message.Id,
                    ChannelName = channel.Name,
                    Preview = preview,
                    IsRead = false,
                    CreatedAt = DateTime.UtcNow
                };
                notifications.Add(notification);
            }

            if (notifications.Count == 0)
            {
                return;
            }

            await _notificationRepository.AddRangeAsync(notifications);

            foreach (var n in notifications)
            {
                await _chatNotificationService.NotifyMentionAsync(
                    n.UserId,
                    new
                    {
                        id = n.Id,
                        type = n.Type,
                        actorUserId = actorUserId,
                        actorUsername,
                        serverId = n.ServerId,
                        channelId = n.ChannelId,
                        messageId = n.MessageId,
                        channelName = n.ChannelName,
                        preview = n.Preview,
                        isRead = false,
                        createdAt = n.CreatedAt
                    });
            }
        }
    }
}
