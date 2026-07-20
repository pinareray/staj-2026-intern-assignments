using Application.Interfaces;
using Application.Repositories;
using MediatR;
using System.Collections.Generic;
using System.Threading;
using System.Threading.Tasks;

namespace Application.Features.Friends.Queries.GetFriends
{
    public class GetFriendsQueryHandler : IRequestHandler<GetFriendsQuery, List<FriendDto>>
    {
        private readonly IFriendshipRepository _friendshipRepository;
        private readonly IUserRepository _userRepository;
        private readonly IUserContextService _userContextService;

        public GetFriendsQueryHandler(
            IFriendshipRepository friendshipRepository,
            IUserRepository userRepository,
            IUserContextService userContextService)
        {
            _friendshipRepository = friendshipRepository;
            _userRepository = userRepository;
            _userContextService = userContextService;
        }

        public async Task<List<FriendDto>> Handle(GetFriendsQuery request, CancellationToken cancellationToken)
        {
            var currentUserId = _userContextService.GetCurrentUserId();
            var result = new List<FriendDto>();

            var accepted = await _friendshipRepository.GetForUserAsync(currentUserId);
            foreach (var f in accepted)
            {
                var friendId = f.RequesterId == currentUserId ? f.AddresseeId : f.RequesterId;
                var user = await _userRepository.GetByIdAsync(friendId);
                result.Add(new FriendDto
                {
                    FriendshipId = f.Id,
                    UserId = friendId,
                    Username = user?.Username ?? "Kullanıcı",
                    Status = "Accepted",
                    IsIncoming = false
                });
            }

            var pendingIncoming = await _friendshipRepository.GetPendingForUserAsync(currentUserId);
            foreach (var f in pendingIncoming)
            {
                var user = await _userRepository.GetByIdAsync(f.RequesterId);
                result.Add(new FriendDto
                {
                    FriendshipId = f.Id,
                    UserId = f.RequesterId,
                    Username = user?.Username ?? "Kullanıcı",
                    Status = "Pending",
                    IsIncoming = true
                });
            }

            var pendingOutgoing = await _friendshipRepository.GetOutgoingPendingForUserAsync(currentUserId);
            foreach (var f in pendingOutgoing)
            {
                var user = await _userRepository.GetByIdAsync(f.AddresseeId);
                result.Add(new FriendDto
                {
                    FriendshipId = f.Id,
                    UserId = f.AddresseeId,
                    Username = user?.Username ?? "Kullanıcı",
                    Status = "Pending",
                    IsIncoming = false
                });
            }

            return result;
        }
    }
}
