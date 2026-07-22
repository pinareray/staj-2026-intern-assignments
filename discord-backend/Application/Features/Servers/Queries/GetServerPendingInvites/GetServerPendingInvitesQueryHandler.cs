using Application.Interfaces;
using Application.Repositories;
using MediatR;
using System;
using System.Collections.Generic;
using System.Threading;
using System.Threading.Tasks;

namespace Application.Features.Servers.Queries.GetServerPendingInvites
{
    public class GetServerPendingInvitesQueryHandler
        : IRequestHandler<GetServerPendingInvitesQuery, List<ServerPendingInviteDto>>
    {
        private readonly IServerInviteRepository _inviteRepository;
        private readonly IServerRepository _serverRepository;
        private readonly IUserRepository _userRepository;
        private readonly IUserContextService _userContextService;

        public GetServerPendingInvitesQueryHandler(
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

        public async Task<List<ServerPendingInviteDto>> Handle(
            GetServerPendingInvitesQuery request,
            CancellationToken cancellationToken)
        {
            var currentUserId = _userContextService.GetCurrentUserId();
            if (!await _serverRepository.IsMemberAsync(request.ServerId, currentUserId))
            {
                throw new Exception("Bu sunucunun davetlerini görme yetkiniz yok.");
            }

            var invites = await _inviteRepository.GetPendingForServerAsync(request.ServerId);
            var result = new List<ServerPendingInviteDto>();

            foreach (var invite in invites)
            {
                var user = await _userRepository.GetByIdAsync(invite.InviteeId);
                result.Add(new ServerPendingInviteDto
                {
                    InviteId = invite.Id,
                    UserId = invite.InviteeId,
                    Username = user?.Username ?? "Kullanıcı"
                });
            }

            return result;
        }
    }
}
