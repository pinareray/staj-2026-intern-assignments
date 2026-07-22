using MediatR;
using System;

namespace Application.Features.Servers.Commands.AcceptInvite
{
    public class AcceptServerInviteCommand : IRequest<object>
    {
        public Guid InviteId { get; set; }
    }
}
