using Application.Interfaces;
using Application.Repositories;
using MediatR;
using System;
using System.Linq;
using System.Threading;
using System.Threading.Tasks;

namespace Application.Features.Users.Queries.GetUserByUsername
{
    public class GetUserByUsernameQueryHandler
        : IRequestHandler<GetUserByUsernameQuery, PublicProfileDto>
    {
        private readonly IUserRepository _userRepository;
        private readonly IFriendshipRepository _friendshipRepository;
        private readonly IServerRepository _serverRepository;
        private readonly IUserContextService _userContextService;

        public GetUserByUsernameQueryHandler(
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

        public async Task<PublicProfileDto> Handle(
            GetUserByUsernameQuery request,
            CancellationToken cancellationToken)
        {
            if (string.IsNullOrWhiteSpace(request.Username))
            {
                throw new Exception("Kullanıcı adı zorunludur.");
            }

            var user = await _userRepository.GetByUsernameAsync(request.Username.Trim());
            if (user == null)
            {
                throw new Exception("Kullanıcı bulunamadı.");
            }

            var currentUserId = _userContextService.GetCurrentUserId();
            var isOwn = user.Id == currentUserId;

            var friends = await _friendshipRepository.GetForUserAsync(user.Id);
            var servers = await _serverRepository.GetByUserIdAsync(user.Id);

            return new PublicProfileDto
            {
                Id = user.Id,
                Username = user.Username,
                CreatedAt = user.CreatedAt,
                AvatarUrl = null,
                Bio = user.Bio,
                Status = user.Status,
                FriendCount = friends.Count,
                ServerCount = servers.Count,
                IsOwnProfile = isOwn,
                Email = isOwn ? user.Email : null,
                Servers = servers
                    .Take(6)
                    .Select(s => new PublicServerDto
                    {
                        Id = s.Id,
                        Name = s.Name,
                        IconUrl = s.IconUrl
                    })
                    .ToList()
            };
        }
    }
}
