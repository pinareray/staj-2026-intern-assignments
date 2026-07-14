using Application.Features.Servers.Queries.GetServers;
using Application.Interfaces;
using Application.Repositories;
using Domain.Entities;
using MediatR;
using System;
using System.Threading;
using System.Threading.Tasks;

namespace Application.Features.Servers.Commands.CreateServer
{
    public class CreateServerCommandHandler : IRequestHandler<CreateServerCommand, ServerDto>
    {
        private readonly IServerRepository _serverRepository;
        private readonly IUserContextService _userContextService;

        public CreateServerCommandHandler(
            IServerRepository serverRepository,
            IUserContextService userContextService)
        {
            _serverRepository = serverRepository;
            _userContextService = userContextService;
        }

        public async Task<ServerDto> Handle(CreateServerCommand request, CancellationToken cancellationToken)
        {
            if (string.IsNullOrWhiteSpace(request.Name))
            {
                throw new Exception("Sunucu adı boş olamaz.");
            }

            var ownerId = _userContextService.GetCurrentUserId();
            var server = new Server
            {
                Id = Guid.NewGuid(),
                Name = request.Name.Trim(),
                IconUrl = null,
                OwnerId = ownerId,
                CreatedAt = DateTime.UtcNow
            };

            await _serverRepository.CreateWithOwnerAsync(server, ownerId);

            return new ServerDto
            {
                Id = server.Id,
                Name = server.Name,
                IconUrl = server.IconUrl
            };
        }
    }
}
