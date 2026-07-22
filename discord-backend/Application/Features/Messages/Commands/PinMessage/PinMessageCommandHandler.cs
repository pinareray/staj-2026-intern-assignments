using Application.Interfaces;
using Application.Repositories;
using MediatR;
using System;
using System.Threading;
using System.Threading.Tasks;

namespace Application.Features.Messages.Commands.PinMessage
{
    public class PinMessageCommandHandler : IRequestHandler<PinMessageCommand, object>
    {
        private readonly IMessageRepository _messageRepository;
        private readonly IUserContextService _userContextService;

        public PinMessageCommandHandler(
            IMessageRepository messageRepository,
            IUserContextService userContextService)
        {
            _messageRepository = messageRepository;
            _userContextService = userContextService;
        }

        public async Task<object> Handle(PinMessageCommand request, CancellationToken cancellationToken)
        {
            var userId = _userContextService.GetCurrentUserId();
            var message = await _messageRepository.GetByIdAsync(request.MessageId);
            if (message == null)
            {
                throw new Exception("Mesaj bulunamadı.");
            }

            if (message.IsPinned)
            {
                return new { messageId = message.Id, isPinned = true };
            }

            message.IsPinned = true;
            message.PinnedAt = DateTime.UtcNow;
            message.PinnedByUserId = userId;
            await _messageRepository.UpdateAsync(message);

            return new
            {
                messageId = message.Id,
                channelId = message.ChannelId,
                isPinned = true
            };
        }
    }
}
