using Application.Interfaces;
using Application.Repositories;
using MediatR;
using System;
using System.Threading;
using System.Threading.Tasks;

namespace Application.Features.Messages.Commands.UnpinMessage
{
    public class UnpinMessageCommandHandler : IRequestHandler<UnpinMessageCommand, object>
    {
        private readonly IMessageRepository _messageRepository;
        private readonly IUserContextService _userContextService;

        public UnpinMessageCommandHandler(
            IMessageRepository messageRepository,
            IUserContextService userContextService)
        {
            _messageRepository = messageRepository;
            _userContextService = userContextService;
        }

        public async Task<object> Handle(UnpinMessageCommand request, CancellationToken cancellationToken)
        {
            _ = _userContextService.GetCurrentUserId();
            var message = await _messageRepository.GetByIdAsync(request.MessageId);
            if (message == null)
            {
                throw new Exception("Mesaj bulunamadı.");
            }

            if (!message.IsPinned)
            {
                return new { messageId = message.Id, isPinned = false };
            }

            message.IsPinned = false;
            message.PinnedAt = null;
            message.PinnedByUserId = null;
            await _messageRepository.UpdateAsync(message);

            return new
            {
                messageId = message.Id,
                channelId = message.ChannelId,
                isPinned = false
            };
        }
    }
}
