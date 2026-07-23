using Application.Interfaces;
using Application.Repositories;
using MediatR;
using System;
using System.Threading;
using System.Threading.Tasks;

namespace Application.Features.Servers.Commands.JoinByInviteCode
{
    public class JoinByInviteCodeCommandHandler
        : IRequestHandler<JoinByInviteCodeCommand, JoinByInviteCodeResult>
    {
        private readonly IServerInviteLinkRepository _linkRepository;
        private readonly IServerRepository _serverRepository;
        private readonly IUserContextService _userContext;

        public JoinByInviteCodeCommandHandler(
            IServerInviteLinkRepository linkRepository,
            IServerRepository serverRepository,
            IUserContextService userContext)
        {
            _linkRepository = linkRepository;
            _serverRepository = serverRepository;
            _userContext = userContext;
        }

        public async Task<JoinByInviteCodeResult> Handle(
            JoinByInviteCodeCommand request,
            CancellationToken cancellationToken)
        {
            if (string.IsNullOrWhiteSpace(request.Code))
            {
                throw new Exception("Geçersiz davet kodu.");
            }

            var currentUserId = _userContext.GetCurrentUserId();
            var link = await _linkRepository.GetByCodeAsync(request.Code.Trim())
                ?? throw new Exception("Davet linki bulunamadı veya geçersiz.");

            var server = await _serverRepository.GetByIdAsync(link.ServerId)
                ?? throw new Exception("Sunucu bulunamadı.");

            if (await _serverRepository.IsMemberAsync(server.Id, currentUserId))
            {
                return new JoinByInviteCodeResult
                {
                    ServerId = server.Id,
                    ServerName = server.Name,
                    AlreadyMember = true
                };
            }

            await _serverRepository.AddMemberAsync(server.Id, currentUserId);
            link.UseCount += 1;
            await _linkRepository.UpdateAsync(link);

            return new JoinByInviteCodeResult
            {
                ServerId = server.Id,
                ServerName = server.Name,
                AlreadyMember = false
            };
        }
    }
}
