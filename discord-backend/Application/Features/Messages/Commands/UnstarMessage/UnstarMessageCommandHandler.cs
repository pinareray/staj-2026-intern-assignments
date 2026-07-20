using Application.Interfaces;
using Application.Repositories;
using MediatR;
using System;
using System.Threading;
using System.Threading.Tasks;

namespace Application.Features.Messages.Commands.UnstarMessage
{
    public class UnstarMessageCommandHandler : IRequestHandler<UnstarMessageCommand, object>
    {
        private readonly IMessageRepository _messageRepository;
        private readonly IStarredMessageRepository _starredMessageRepository;
        private readonly IUserContextService _userContextService;

        public UnstarMessageCommandHandler(
            IMessageRepository messageRepository,
            IStarredMessageRepository starredMessageRepository,
            IUserContextService userContextService)
        {
            _messageRepository = messageRepository;
            _starredMessageRepository = starredMessageRepository;
            _userContextService = userContextService;
        }

        public async Task<object> Handle(UnstarMessageCommand request, CancellationToken cancellationToken)
        {
            var userId = _userContextService.GetCurrentUserId();
            var message = await _messageRepository.GetByIdAsync(request.MessageId);
            if (message == null)
            {
                throw new Exception("Mesaj bulunamadı.");
            }

            await _starredMessageRepository.UnstarAsync(userId, request.MessageId);

            return new { messageId = request.MessageId, isStarred = false };
        }
    }
}
