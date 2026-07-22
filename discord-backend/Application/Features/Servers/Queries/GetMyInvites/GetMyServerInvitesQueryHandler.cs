using Application.Interfaces;
using Application.Repositories;
using MediatR;
using System.Collections.Generic;
using System.Threading;
using System.Threading.Tasks;

namespace Application.Features.Servers.Queries.GetMyInvites
{
    public class GetMyServerInvitesQueryHandler
        : IRequestHandler<GetMyServerInvitesQuery, List<ServerInviteDto>>
    {
        private readonly IServerInviteRepository _inviteRepository;
        private readonly IServerRepository _serverRepository;
        private readonly IUserRepository _userRepository;
        private readonly IUserContextService _userContextService;

        public GetMyServerInvitesQueryHandler(
            IServerInviteRepository inviteRepository,
            IServerRepository serverRepository,
            IUserRepository userRepository,
            IUserContextService userContextService)
        {
            _inviteRepository = inviteRepository;
            _serverRepository = serverRepository;
            _userRepository = userRepository;
            _userContextService = userContextService;
        }

        public async Task<List<ServerInviteDto>> Handle(
            GetMyServerInvitesQuery request,
            CancellationToken cancellationToken)
        {
            var currentUserId = _userContextService.GetCurrentUserId();
            var invites = await _inviteRepository.GetPendingForInviteeAsync(currentUserId);
            var result = new List<ServerInviteDto>();

            foreach (var invite in invites)
            {
                var server = await _serverRepository.GetByIdAsync(invite.ServerId);
                if (server == null) continue;

                var inviter = await _userRepository.GetByIdAsync(invite.InviterId);
                result.Add(new ServerInviteDto
                {
                    InviteId = invite.Id,
                    ServerId = invite.ServerId,
                    ServerName = server.Name,
                    InviterId = invite.InviterId,
                    InviterUsername = inviter?.Username ?? "Kullanıcı",
                    Status = invite.Status,
                    CreatedAt = invite.CreatedAt
                });
            }

            return result;
        }
    }
}
