using MediatR;
using System;

namespace Application.Features.Messages.Commands.EditMessage
{
    public class EditMessageCommand : IRequest<object>
    {
        public Guid MessageId { get; set; }
        public string Content { get; set; } = string.Empty;
    }
}
