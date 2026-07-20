using Application.Interfaces;
using Application.Repositories;
using Domain.Entities;
using MediatR;
using System;
using System.Threading;
using System.Threading.Tasks;

namespace Application.Features.Friends.Commands.AddFriend
{
    public class AddFriendCommandHandler : IRequestHandler<AddFriendCommand, object>
    {
        private readonly IFriendshipRepository _friendshipRepository;
        private readonly IUserRepository _userRepository;
        private readonly IUserContextService _userContextService;

        public AddFriendCommandHandler(
            IFriendshipRepository friendshipRepository,
            IUserRepository userRepository,
            IUserContextService userContextService)
        {
            _friendshipRepository = friendshipRepository;
            _userRepository = userRepository;
            _userContextService = userContextService;
        }

        public async Task<object> Handle(AddFriendCommand request, CancellationToken cancellationToken)
        {
            var username = request.Username.Trim().TrimStart('@');
            if (string.IsNullOrWhiteSpace(username))
            {
                throw new Exception("Kullanıcı adı zorunludur.");
            }

            var currentUserId = _userContextService.GetCurrentUserId();
            var target = await _userRepository.GetByUsernameAsync(username);

            if (target == null)
            {
                throw new Exception("Kullanıcı bulunamadı.");
            }

            if (target.Id == currentUserId)
            {
                throw new Exception("Kendine arkadaşlık isteği gönderemezsin.");
            }

            var existing = await _friendshipRepository.GetBetweenUsersAsync(currentUserId, target.Id);
            if (existing != null)
            {
                throw new Exception(
                    existing.Status == "Accepted"
                        ? "Bu kullanıcı zaten arkadaşın."
                        : "Zaten bekleyen bir istek var.");
            }

            var friendship = new Friendship
            {
                Id = Guid.NewGuid(),
                RequesterId = currentUserId,
                AddresseeId = target.Id,
                Status = "Pending",
                CreatedAt = DateTime.UtcNow
            };

            await _friendshipRepository.AddAsync(friendship);

            return new
            {
                friendship.Id,
                friendship.RequesterId,
                friendship.AddresseeId,
                friendship.Status,
                Username = target.Username
            };
        }
    }
}
