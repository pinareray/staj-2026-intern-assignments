using System;

namespace Application.Features.Servers.Queries.GetServers
{
    public class ServerDto
    {
        public Guid Id { get; set; }
        public string Name { get; set; }
        public string? IconUrl { get; set; }
    }
}
