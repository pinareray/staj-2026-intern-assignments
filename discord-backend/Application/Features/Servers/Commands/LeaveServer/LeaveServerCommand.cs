using MediatR;
using System;

namespace Application.Features.Servers.Commands.LeaveServer
{
    public class LeaveServerCommand : IRequest<object>
    {
        public Guid ServerId { get; set; }
    }
}
