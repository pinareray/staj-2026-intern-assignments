using Application.Interfaces;
using Application.Repositories;
using Domain.Entities;
using MediatR;
using System;
using System.Threading;
using System.Threading.Tasks;

namespace Application.Features.Moderation.Commands.BlockUser
{
    public class BlockUserCommandHandler : IRequestHandler<BlockUserCommand, object>
    {
        private readonly IUserBlockRepository _blockRepository;
        private readonly IUserRepository _userRepository;
        private readonly IUserContextService _userContextService;

        public BlockUserCommandHandler(
            IUserBlockRepository blockRepository,
            IUserRepository userRepository,
            IUserContextService userContextService)
        {
            _blockRepository = blockRepository;
            _userRepository = userRepository;
            _userContextService = userContextService;
        }

        public async Task<object> Handle(BlockUserCommand request, CancellationToken cancellationToken)
        {
            var currentUserId = _userContextService.GetCurrentUserId();
            if (request.UserId == currentUserId)
            {
                throw new Exception("Kendinizi engelleyemezsiniz.");
            }

            var target = await _userRepository.GetByIdAsync(request.UserId);
            if (target == null)
            {
                throw new Exception("Kullanıcı bulunamadı.");
            }

            var existing = await _blockRepository.GetAsync(currentUserId, request.UserId);
            if (existing != null)
            {
                return new { blocked = true, userId = request.UserId, alreadyBlocked = true };
            }

            await _blockRepository.AddAsync(new UserBlock
            {
                Id = Guid.NewGuid(),
                BlockerId = currentUserId,
                BlockedId = request.UserId,
                CreatedAt = DateTime.UtcNow
            });

            return new { blocked = true, userId = request.UserId, alreadyBlocked = false };
        }
    }
}
