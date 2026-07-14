using MediatR;
using System.Collections.Generic;

namespace Application.Features.Servers.Queries.GetServers
{
    public class GetServersQuery : IRequest<List<ServerDto>>
    {
    }
}
