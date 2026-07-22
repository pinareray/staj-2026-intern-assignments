using Application.Interfaces;
using Application.Repositories;
using MediatR;
using System;
using System.Threading;
using System.Threading.Tasks;

namespace Application.Features.Moderation.Commands.UnblockUser
{
    public class UnblockUserCommandHandler : IRequestHandler<UnblockUserCommand, object>
    {
        private readonly IUserBlockRepository _blockRepository;
        private readonly IUserContextService _userContextService;

        public UnblockUserCommandHandler(
            IUserBlockRepository blockRepository,
            IUserContextService userContextService)
        {
            _blockRepository = blockRepository;
            _userContextService = userContextService;
        }

        public async Task<object> Handle(UnblockUserCommand request, CancellationToken cancellationToken)
        {
            var currentUserId = _userContextService.GetCurrentUserId();
            var existing = await _blockRepository.GetAsync(currentUserId, request.UserId);
            if (existing == null)
            {
                return new { blocked = false, userId = request.UserId };
            }

            await _blockRepository.DeleteAsync(existing);
            return new { blocked = false, userId = request.UserId };
        }
    }
}
