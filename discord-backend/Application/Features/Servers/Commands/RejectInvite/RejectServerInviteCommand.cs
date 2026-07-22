using MediatR;
using System;

namespace Application.Features.Servers.Commands.RejectInvite
{
    public class RejectServerInviteCommand : IRequest<object>
    {
        public Guid InviteId { get; set; }
    }
}
