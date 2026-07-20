using Application.Interfaces;
using Application.Repositories;
using MediatR;
using System;
using System.Threading;
using System.Threading.Tasks;

namespace Application.Features.Dms.Commands.OpenDm
{
    public class OpenDmCommandHandler : IRequestHandler<OpenDmCommand, object>
    {
        private readonly IUserContextService _userContextService;
        private readonly IFriendshipRepository _friendshipRepository;
        private readonly IDmChannelService _dmChannelService;
        private readonly IUserRepository _userRepository;

        public OpenDmCommandHandler(
            IUserContextService userContextService,
            IFriendshipRepository friendshipRepository,
            IDmChannelService dmChannelService,
            IUserRepository userRepository)
        {
            _userContextService = userContextService;
            _friendshipRepository = friendshipRepository;
            _dmChannelService = dmChannelService;
            _userRepository = userRepository;
        }

        public async Task<object> Handle(OpenDmCommand request, CancellationToken cancellationToken)
        {
            var currentUserId = _userContextService.GetCurrentUserId();

            if (request.FriendUserId == currentUserId)
            {
                throw new Exception("Kendinize DM açılamaz.");
            }

            var friendship = await _friendshipRepository.GetBetweenUsersAsync(
                currentUserId,
                request.FriendUserId);

            if (friendship == null || friendship.Status != "Accepted")
            {
                throw new Exception("Sadece arkadaşlarınızla mesajlaşabilirsiniz.");
            }

            var channel = await _dmChannelService.FindOrCreateDmAsync(
                currentUserId,
                request.FriendUserId,
                seedGreeting: false);

            var friend = await _userRepository.GetByIdAsync(request.FriendUserId);

            return new
            {
                ChannelId = channel.Id,
                UserId = request.FriendUserId,
                Username = friend?.Username ?? "Kullanıcı"
            };
        }
    }
}
