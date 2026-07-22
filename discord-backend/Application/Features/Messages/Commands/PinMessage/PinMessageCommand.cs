using MediatR;
using System;

namespace Application.Features.Messages.Commands.PinMessage
{
    public class PinMessageCommand : IRequest<object>
    {
        public Guid MessageId { get; set; }
    }
}
