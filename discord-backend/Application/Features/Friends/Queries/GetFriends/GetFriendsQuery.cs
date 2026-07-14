using MediatR;
using System;
using System.Collections.Generic;

namespace Application.Features.Friends.Queries.GetFriends
{
    public class FriendDto
    {
        public Guid FriendshipId { get; set; }
        public Guid UserId { get; set; }
        public string Username { get; set; }
        public string Status { get; set; }
        public bool IsIncoming { get; set; }
    }

    public class GetFriendsQuery : IRequest<List<FriendDto>>
    {
    }
}
