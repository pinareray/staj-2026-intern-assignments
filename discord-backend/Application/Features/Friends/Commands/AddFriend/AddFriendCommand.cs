using MediatR;

namespace Application.Features.Friends.Commands.AddFriend
{
    public class AddFriendCommand : IRequest<object>
    {
        public string Username { get; set; }
    }
}
