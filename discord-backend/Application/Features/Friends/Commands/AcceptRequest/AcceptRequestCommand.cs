using MediatR;
using System;

namespace Application.Features.Friends.Commands.AcceptRequest
{
    public class AcceptRequestDto
    {
        public Guid FriendshipId { get; set; }
    }

    public class AcceptRequestCommand : IRequest<object>
    {
        public Guid FriendshipId { get; set; }
    }
}
