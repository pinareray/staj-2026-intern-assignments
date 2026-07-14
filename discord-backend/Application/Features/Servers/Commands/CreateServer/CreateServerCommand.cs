using Application.Features.Servers.Queries.GetServers;
using MediatR;

namespace Application.Features.Servers.Commands.CreateServer
{
    public class CreateServerCommand : IRequest<ServerDto>
    {
        public string Name { get; set; }
    }
}
