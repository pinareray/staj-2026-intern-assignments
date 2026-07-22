using MediatR;
using System;

namespace Application.Features.Servers.Commands.AddMember
{
    public class AddServerMemberCommand : IRequest<object>
    {
        public Guid ServerId { get; set; }
        public string Username { get; set; }
    }
}
