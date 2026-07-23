using MediatR;
using System;

namespace Application.Features.Servers.Commands.DeleteServer
{
    public class DeleteServerCommand : IRequest<object>
    {
        public Guid ServerId { get; set; }
    }
}
