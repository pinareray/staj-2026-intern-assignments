using MediatR;
using System;

namespace Application.Features.Dms.Commands.OpenDm
{
    public class OpenDmCommand : IRequest<object>
    {
        public Guid FriendUserId { get; set; }
    }
}
