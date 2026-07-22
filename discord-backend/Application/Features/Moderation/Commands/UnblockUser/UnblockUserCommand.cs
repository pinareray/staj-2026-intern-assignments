using MediatR;
using System;

namespace Application.Features.Moderation.Commands.UnblockUser
{
    public class UnblockUserCommand : IRequest<object>
    {
        public Guid UserId { get; set; }
    }
}
