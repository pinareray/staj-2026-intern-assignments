using MediatR;
using System;

namespace Application.Features.Messages.Commands.UnstarMessage
{
    public class UnstarMessageCommand : IRequest<object>
    {
        public Guid MessageId { get; set; }
    }
}
