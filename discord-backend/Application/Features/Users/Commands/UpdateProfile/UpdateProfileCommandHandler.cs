using Application.Features.Users.Queries.GetProfile;
using Application.Interfaces;
using Application.Repositories;
using MediatR;
using System;
using System.Threading;
using System.Threading.Tasks;

namespace Application.Features.Users.Commands.UpdateProfile
{
    public class UpdateProfileCommandHandler : IRequestHandler<UpdateProfileCommand, GetProfileResponse>
    {
        private readonly IUserRepository _userRepository;
        private readonly IFriendshipRepository _friendshipRepository;
        private readonly IServerRepository _serverRepository;
        private readonly IUserContextService _userContextService;

        public UpdateProfileCommandHandler(
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

        public async Task<GetProfileResponse> Handle(UpdateProfileCommand request, CancellationToken cancellationToken)
        {
            if (string.IsNullOrWhiteSpace(request.Username))
            {
                throw new Exception("Kullanıcı adı boş olamaz.");
            }

            var userId = _userContextService.GetCurrentUserId();
            var user = await _userRepository.GetByIdAsync(userId);

            if (user == null)
            {
                throw new Exception("Kullanıcı bulunamadı.");
            }

            user.Username = request.Username.Trim();
            user.Bio = string.IsNullOrWhiteSpace(request.Bio) ? null : request.Bio.Trim();
            user.Status = string.IsNullOrWhiteSpace(request.Status) ? null : request.Status.Trim();
            await _userRepository.UpdateAsync(user);

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
                ServerCount = servers.Count
            };
        }
    }
}
