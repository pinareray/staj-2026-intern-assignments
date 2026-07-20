using MediatR;
using System;

namespace Application.Features.Messages.Commands.StarMessage
{
    public class StarMessageCommand : IRequest<object>
    {
        public Guid MessageId { get; set; }
    }
}
