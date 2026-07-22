using System;
using System.Collections.Generic;
using MediatR;

namespace Application.Features.Servers.Queries.GetMyInvites
{
    public class GetMyServerInvitesQuery : IRequest<List<ServerInviteDto>>
    {
    }

    public class ServerInviteDto
    {
        public Guid InviteId { get; set; }
        public Guid ServerId { get; set; }
        public string ServerName { get; set; } = string.Empty;
        public Guid InviterId { get; set; }
        public string InviterUsername { get; set; } = string.Empty;
        public string Status { get; set; } = "Pending";
        public DateTime CreatedAt { get; set; }
    }
}
