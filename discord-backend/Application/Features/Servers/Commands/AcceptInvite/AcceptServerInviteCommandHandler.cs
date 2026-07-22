using Application.Interfaces;
using Application.Repositories;
using MediatR;
using System;
using System.Threading;
using System.Threading.Tasks;

namespace Application.Features.Servers.Commands.AcceptInvite
{
    public class AcceptServerInviteCommandHandler : IRequestHandler<AcceptServerInviteCommand, object>
    {
        private readonly IServerInviteRepository _inviteRepository;
        private readonly IServerRepository _serverRepository;
        private readonly IUserContextService _userContextService;

        public AcceptServerInviteCommandHandler(
            IServerInviteRepository inviteRepository,
            IServerRepository serverRepository,
            IUserContextService userContextService)
        {
            _inviteRepository = inviteRepository;
            _serverRepository = serverRepository;
            _userContextService = userContextService;
        }

        public async Task<object> Handle(
            AcceptServerInviteCommand request,
            CancellationToken cancellationToken)
        {
            var currentUserId = _userContextService.GetCurrentUserId();
            var invite = await _inviteRepository.GetByIdAsync(request.InviteId);

            if (invite == null)
            {
                throw new Exception("Davet bulunamadı.");
            }

            if (invite.InviteeId != currentUserId)
            {
                throw new Exception("Bu daveti sadece davet edilen kişi kabul edebilir.");
            }

            if (invite.Status != "Pending")
            {
                throw new Exception("Davet zaten işlenmiş.");
            }

            var server = await _serverRepository.GetByIdAsync(invite.ServerId);
            if (server == null)
            {
                await _inviteRepository.DeleteAsync(invite);
                throw new Exception("Sunucu artık mevcut değil.");
            }

            if (!await _serverRepository.IsMemberAsync(invite.ServerId, currentUserId))
            {
                await _serverRepository.AddMemberAsync(invite.ServerId, currentUserId);
            }

            invite.Status = "Accepted";
            await _inviteRepository.UpdateAsync(invite);

            return new
            {
                invite.Id,
                invite.ServerId,
                serverName = server.Name,
                status = invite.Status
            };
        }
    }
}
