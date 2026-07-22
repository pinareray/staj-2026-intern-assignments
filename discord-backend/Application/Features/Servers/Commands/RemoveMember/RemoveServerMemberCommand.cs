using MediatR;
using System;

namespace Application.Features.Servers.Commands.RemoveMember
{
    public class RemoveServerMemberCommand : IRequest<object>
    {
        public Guid ServerId { get; set; }
        public Guid UserId { get; set; }
    }
}
