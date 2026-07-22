using Application.Common;
using Application.Interfaces;
using Application.Repositories;
using MediatR;
using System;
using System.Threading;
using System.Threading.Tasks;

namespace Application.Features.Messages.Commands.DeleteMessage
{
    public class DeleteMessageCommandHandler : IRequestHandler<DeleteMessageCommand, object>
    {
        private readonly IMessageRepository _messageRepository;
        private readonly IChannelRepository _channelRepository;
        private readonly IServerRepository _serverRepository;
        private readonly IUserContextService _userContextService;
        private readonly IChatNotificationService _chatNotificationService;

        public DeleteMessageCommandHandler(
            IMessageRepository messageRepository,
            IChannelRepository channelRepository,
            IServerRepository serverRepository,
            IUserContextService userContextService,
            IChatNotificationService chatNotificationService)
        {
            _messageRepository = messageRepository;
            _channelRepository = channelRepository;
            _serverRepository = serverRepository;
            _userContextService = userContextService;
            _chatNotificationService = chatNotificationService;
        }

        public async Task<object> Handle(
            DeleteMessageCommand request,
            CancellationToken cancellationToken)
        {
            var message = await _messageRepository.GetByIdAsync(request.MessageId);
            if (message == null)
            {
                throw new Exception("Mesaj bulunamadı.");
            }

            var currentUserId = _userContextService.GetCurrentUserId();
            var isAuthor = message.UserId == currentUserId;
            var isModerator = false;

            var channel = await _channelRepository.GetByIdAsync(message.ChannelId);
            if (channel?.ServerId != null && channel.ServerId != Guid.Empty)
            {
                var membership = await _serverRepository.GetMembershipAsync(
                    channel.ServerId.Value,
                    currentUserId);
                isModerator = ServerRoles.CanManageChannels(membership?.Role);
            }

            if (!isAuthor && !isModerator)
            {
                throw new Exception("Bu mesajı silme yetkiniz yok.");
            }

            await _messageRepository.DeleteAsync(message.Id);

            var payload = new
            {
                messageId = message.Id,
                channelId = message.ChannelId
            };
            await _chatNotificationService.NotifyMessageDeletedAsync(
                message.ChannelId.ToString(),
                payload);

            return new { deleted = true, messageId = message.Id, channelId = message.ChannelId };
        }
    }
}
