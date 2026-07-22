using Application.Interfaces;
using Application.Repositories;
using MediatR;
using System;
using System.Threading;
using System.Threading.Tasks;

namespace Application.Features.Users.Queries.GetProfile
{
    public class GetProfileQueryHandler : IRequestHandler<GetProfileQuery, GetProfileResponse>
    {
        private readonly IUserRepository _userRepository;
        private readonly IFriendshipRepository _friendshipRepository;
        private readonly IServerRepository _serverRepository;
        private readonly IUserContextService _userContextService;

        public GetProfileQueryHandler(
            IUserRepository userRepository,
            IFriendshipRepository friendshipRepository,
            IServerRepository serverRepository,
            IUserContextService userContextService)
        {
            _userRepository = userRepository;
            _friendshipRepository = friendshipRepository;
            _serverRepository = serverRepository;
            _userContextService = userContextService;
        }

        public async Task<GetProfileResponse> Handle(GetProfileQuery request, CancellationToken cancellationToken)
        {
            var userId = _userContextService.GetCurrentUserId();
            var user = await _userRepository.GetByIdAsync(userId);

            if (user == null)
            {
                throw new Exception("Kullanıcı bulunamadı.");
            }

            var friends = await _friendshipRepository.GetForUserAsync(userId);
            var servers = await _serverRepository.GetByUserIdAsync(userId);

            return new GetProfileResponse
            {
                Id = user.Id,
                Email = user.Email,
                Username = user.Username,
                CreatedAt = user.CreatedAt,
                Bio = user.Bio,
                Status = user.Status,
                FriendCount = friends.Count,
                ServerCount = servers.Count,
                IsPlatformAdmin = user.IsPlatformAdmin
            };
        }
    }
}
