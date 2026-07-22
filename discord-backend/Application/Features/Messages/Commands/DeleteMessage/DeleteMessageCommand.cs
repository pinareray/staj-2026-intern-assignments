using MediatR;
using System;

namespace Application.Features.Messages.Commands.DeleteMessage
{
    public class DeleteMessageCommand : IRequest<object>
    {
        public Guid MessageId { get; set; }
    }
}
