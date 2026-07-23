using Application.Features.Servers.Queries.GetServers;
using MediatR;
using System;

namespace Application.Features.Servers.Commands.UpdateServer
{
    public class UpdateServerCommand : IRequest<ServerDto>
    {
        public Guid ServerId { get; set; }
        public string? Name { get; set; }
        public string? IconUrl { get; set; }
    }
}
