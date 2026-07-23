using Application.Interfaces;
using Application.Repositories;
using MediatR;
using System;
using System.Threading;
using System.Threading.Tasks;

namespace Application.Features.Servers.Queries.GetInviteByCode
{
    public class GetInviteByCodeQueryHandler
        : IRequestHandler<GetInviteByCodeQuery, InvitePreviewDto>
    {
        private readonly IServerInviteLinkRepository _linkRepository;
        private readonly IServerRepository _serverRepository;
        private readonly IUserContextService _userContext;

        public GetInviteByCodeQueryHandler(
            IServerInviteLinkRepository linkRepository,
            IServerRepository serverRepository,
            IUserContextService userContext)
        {
            _linkRepository = linkRepository;
            _serverRepository = serverRepository;
            _userContext = userContext;
        }

        public async Task<InvitePreviewDto> Handle(
            GetInviteByCodeQuery request,
            CancellationToken cancellationToken)
        {
            if (string.IsNullOrWhiteSpace(request.Code))
            {
                throw new Exception("Geçersiz davet kodu.");
            }

            var link = await _linkRepository.GetByCodeAsync(request.Code.Trim())
                ?? throw new Exception("Davet linki bulunamadı veya geçersiz.");

            var server = await _serverRepository.GetByIdAsync(link.ServerId)
                ?? throw new Exception("Sunucu bulunamadı.");

            var alreadyMember = false;
            try
            {
                var userId = _userContext.GetCurrentUserId();
                alreadyMember = await _serverRepository.IsMemberAsync(server.Id, userId);
            }
            catch
            {
                // Anonim / token yoksa AlreadyMember = false
            }

            return new InvitePreviewDto
            {
                Code = link.Code,
                ServerId = server.Id,
                ServerName = server.Name,
                AlreadyMember = alreadyMember
            };
        }
    }
}
