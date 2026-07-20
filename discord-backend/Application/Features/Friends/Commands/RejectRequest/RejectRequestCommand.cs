using MediatR;
using System;

namespace Application.Features.Friends.Commands.RejectRequest
{
    public class RejectRequestDto
    {
        public Guid FriendshipId { get; set; }
    }

    public class RejectRequestCommand : IRequest<object>
    {
        public Guid FriendshipId { get; set; }
    }
}
