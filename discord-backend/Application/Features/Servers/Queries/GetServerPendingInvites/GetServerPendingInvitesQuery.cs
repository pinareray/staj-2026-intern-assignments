using MediatR;
using System;
using System.Collections.Generic;

namespace Application.Features.Servers.Queries.GetServerPendingInvites
{
    public class GetServerPendingInvitesQuery : IRequest<List<ServerPendingInviteDto>>
    {
        public Guid ServerId { get; set; }
    }

    public class ServerPendingInviteDto
    {
        public Guid InviteId { get; set; }
        public Guid UserId { get; set; }
        public string Username { get; set; } = string.Empty;
    }
}
