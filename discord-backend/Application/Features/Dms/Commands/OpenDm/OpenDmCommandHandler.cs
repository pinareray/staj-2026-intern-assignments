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
        private readonly IUserBlockRepository _blockRepository;

        public OpenDmCommandHandler(
            IUserContextService userContextService,
            IFriendshipRepository friendshipRepository,
            IDmChannelService dmChannelService,
            IUserRepository userRepository,
            IUserBlockRepository blockRepository)
        {
            _userContextService = userContextService;
            _friendshipRepository = friendshipRepository;
            _dmChannelService = dmChannelService;
            _userRepository = userRepository;
            _blockRepository = blockRepository;
        }

        public async Task<object> Handle(OpenDmCommand request, CancellationToken cancellationToken)
        {
            var currentUserId = _userContextService.GetCurrentUserId();

            if (request.FriendUserId == currentUserId)
            {
                throw new Exception("Kendinize DM açılamaz.");
            }

            if (await _blockRepository.IsBlockedEitherWayAsync(currentUserId, request.FriendUserId))
            {
                throw new Exception("Engellenmiş bir kullanıcıyla mesajlaşamazsınız.");
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
