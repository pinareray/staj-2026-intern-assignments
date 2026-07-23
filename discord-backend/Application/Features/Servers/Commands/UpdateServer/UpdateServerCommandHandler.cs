using Application.Features.Servers.Queries.GetServers;
using Application.Interfaces;
using Application.Repositories;
using MediatR;
using System;
using System.Threading;
using System.Threading.Tasks;

namespace Application.Features.Servers.Commands.UpdateServer
{
    public class UpdateServerCommandHandler : IRequestHandler<UpdateServerCommand, ServerDto>
    {
        private readonly IServerRepository _serverRepository;
        private readonly IUserContextService _userContextService;

        public UpdateServerCommandHandler(
            IServerRepository serverRepository,
            IUserContextService userContextService)
        {
            _serverRepository = serverRepository;
            _userContextService = userContextService;
        }

        public async Task<ServerDto> Handle(UpdateServerCommand request, CancellationToken cancellationToken)
        {
            var server = await _serverRepository.GetByIdAsync(request.ServerId)
                ?? throw new Exception("Sunucu bulunamadı.");

            var userId = _userContextService.GetCurrentUserId();
            var membership = await _serverRepository.GetMembershipAsync(request.ServerId, userId);
            if (membership == null || membership.Role is not ("Owner" or "Admin"))
            {
                throw new Exception("Sunucuyu yalnızca sahip veya yönetici güncelleyebilir.");
            }

            if (!string.IsNullOrWhiteSpace(request.Name))
            {
                server.Name = request.Name.Trim();
            }

            if (request.IconUrl != null)
            {
                server.IconUrl = string.IsNullOrWhiteSpace(request.IconUrl)
                    ? null
                    : request.IconUrl.Trim();
            }

            await _serverRepository.UpdateAsync(server);

            return new ServerDto
            {
                Id = server.Id,
                Name = server.Name,
                IconUrl = server.IconUrl
            };
        }
    }
}
