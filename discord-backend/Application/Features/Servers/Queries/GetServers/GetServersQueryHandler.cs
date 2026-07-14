using Application.Interfaces;
using Application.Repositories;
using MediatR;
using System.Collections.Generic;
using System.Linq;
using System.Threading;
using System.Threading.Tasks;

namespace Application.Features.Servers.Queries.GetServers
{
    public class GetServersQueryHandler : IRequestHandler<GetServersQuery, List<ServerDto>>
    {
        private readonly IServerRepository _serverRepository;
        private readonly IUserContextService _userContextService;

        public GetServersQueryHandler(
            IServerRepository serverRepository,
            IUserContextService userContextService)
        {
            _serverRepository = serverRepository;
            _userContextService = userContextService;
        }

        public async Task<List<ServerDto>> Handle(GetServersQuery request, CancellationToken cancellationToken)
        {
            var userId = _userContextService.GetCurrentUserId();
            var servers = await _serverRepository.GetByUserIdAsync(userId);

            return servers.Select(s => new ServerDto
            {
                Id = s.Id,
                Name = s.Name,
                IconUrl = s.IconUrl
            }).ToList();
        }
    }
}
