using MediatR;
using System;

namespace Application.Features.Messages.Commands.SendMessage
{
    // Kayıt sonrası SignalR ile yayılacak mesaj verisini döner.
    public class SendMessageCommand : IRequest<object>
    {
        public Guid ChannelId { get; set; }
        public Guid UserId { get; set; }
        public string Content { get; set; } = string.Empty;
        public string? AttachmentUrl { get; set; }
    }
}
