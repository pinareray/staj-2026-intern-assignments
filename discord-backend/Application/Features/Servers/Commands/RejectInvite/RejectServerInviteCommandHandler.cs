using Application.Interfaces;
using Application.Repositories;
using MediatR;
using System;
using System.Threading;
using System.Threading.Tasks;

namespace Application.Features.Servers.Commands.RejectInvite
{
    public class RejectServerInviteCommandHandler : IRequestHandler<RejectServerInviteCommand, object>
    {
        private readonly IServerInviteRepository _inviteRepository;
        private readonly IUserContextService _userContextService;

        public RejectServerInviteCommandHandler(
            IServerInviteRepository inviteRepository,
            IUserContextService userContextService)
        {
            _inviteRepository = inviteRepository;
            _userContextService = userContextService;
        }

        public async Task<object> Handle(
            RejectServerInviteCommand request,
            CancellationToken cancellationToken)
        {
            var currentUserId = _userContextService.GetCurrentUserId();
            var invite = await _inviteRepository.GetByIdAsync(request.InviteId);

            if (invite == null)
            {
                throw new Exception("Davet bulunamadı.");
            }

            // Davet edilen reddeder; davet eden iptal eder.
            if (invite.InviteeId != currentUserId && invite.InviterId != currentUserId)
            {
                throw new Exception("Bu daveti iptal/reddetme yetkiniz yok.");
            }

            if (invite.Status != "Pending")
            {
                throw new Exception("Davet zaten işlenmiş.");
            }

            var asCancel = invite.InviterId == currentUserId;
            await _inviteRepository.DeleteAsync(invite);

            return new
            {
                inviteId = request.InviteId,
                cancelled = asCancel,
                rejected = !asCancel
            };
        }
    }
}
