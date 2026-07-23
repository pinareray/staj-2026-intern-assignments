using MediatR;
using System;

namespace Application.Features.Servers.Commands.UpdateMemberRole
{
    public class UpdateMemberRoleCommand : IRequest<object>
    {
        public Guid ServerId { get; set; }
        public Guid UserId { get; set; }
        /// <summary>Admin | Member</summary>
        public string Role { get; set; } = "Member";
    }
}
