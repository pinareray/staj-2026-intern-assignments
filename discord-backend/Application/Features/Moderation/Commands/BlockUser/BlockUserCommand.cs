using MediatR;
using System;

namespace Application.Features.Moderation.Commands.BlockUser
{
    public class BlockUserCommand : IRequest<object>
    {
        public Guid UserId { get; set; }
    }
}
