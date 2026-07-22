using MediatR;
using System;

namespace Application.Features.Messages.Commands.UnpinMessage
{
    public class UnpinMessageCommand : IRequest<object>
    {
        public Guid MessageId { get; set; }
    }
}
