using Application.Interfaces;
using Application.Repositories;
using Domain.Entities;
using MediatR;
using System;
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
        private readonly IChatNotificationService _chatNotificationService;

        public SendMessageCommandHandler(
            IMessageRepository messageRepository,
            IUserRepository userRepository,
            IChannelRepository channelRepository,
            IChannelMemberRepository channelMemberRepository,
            IChatNotificationService chatNotificationService)
        {
            _messageRepository = messageRepository;
            _userRepository = userRepository;
            _channelRepository = channelRepository;
            _channelMemberRepository = channelMemberRepository;
            _chatNotificationService = chatNotificationService;
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

            return payload;
        }
    }
}
