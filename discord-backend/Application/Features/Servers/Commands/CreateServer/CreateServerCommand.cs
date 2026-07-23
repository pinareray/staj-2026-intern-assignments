using Application.Features.Servers.Queries.GetServers;
using MediatR;

namespace Application.Features.Servers.Commands.CreateServer
{
    public class CreateServerCommand : IRequest<ServerDto>
    {
        public string Name { get; set; } = string.Empty;
        public string? IconUrl { get; set; }
        /// <summary>custom | gaming | friends | study | school</summary>
        public string? Template { get; set; }
    }
}
