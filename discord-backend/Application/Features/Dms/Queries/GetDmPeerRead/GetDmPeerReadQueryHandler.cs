using Application.Interfaces;
using Application.Repositories;
using MediatR;
using System;
using System.Linq;
using System.Threading;
using System.Threading.Tasks;

namespace Application.Features.Dms.Queries.GetDmPeerRead
{
    public class GetDmPeerReadQueryHandler : IRequestHandler<GetDmPeerReadQuery, object>
    {
        private readonly IUserContextService _userContextService;
        private readonly IChannelRepository _channelRepository;
        private readonly IChannelMemberRepository _channelMemberRepository;
        private readonly IUserRepository _userRepository;

        public GetDmPeerReadQueryHandler(
            IUserContextService userContextService,
            IChannelRepository channelRepository,
            IChannelMemberRepository channelMemberRepository,
            IUserRepository userRepository)
        {
            _userContextService = userContextService;
            _channelRepository = channelRepository;
            _channelMemberRepository = channelMemberRepository;
            _userRepository = userRepository;
        }

        public async Task<object> Handle(GetDmPeerReadQuery request, CancellationToken cancellationToken)
        {
            var currentUserId = _userContextService.GetCurrentUserId();
            var channel = await _channelRepository.GetByIdAsync(request.ChannelId);

            if (channel == null || channel.Type != "DM")
            {
                throw new Exception("DM kanalı bulunamadı.");
            }

            var isMember = await _channelMemberRepository.IsMemberAsync(
                request.ChannelId,
                currentUserId);
            if (!isMember)
            {
                throw new Exception("Bu DM kanalına erişim yetkiniz yok.");
            }

            var members = await _channelMemberRepository.GetByChannelIdAsync(request.ChannelId);
            var peer = members.FirstOrDefault(m => m.UserId != currentUserId);
            if (peer == null)
            {
                return new { peerUserId = (Guid?)null, peerUsername = (string?)null, lastReadAt = (DateTime?)null };
            }

            var peerUser = await _userRepository.GetByIdAsync(peer.UserId);

            return new
            {
                peerUserId = peer.UserId,
                peerUsername = peerUser?.Username,
                lastReadAt = peer.LastReadAt
            };
        }
    }
}
