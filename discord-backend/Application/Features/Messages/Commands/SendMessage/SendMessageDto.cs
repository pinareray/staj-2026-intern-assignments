using System;

namespace Application.Features.Messages.Commands.SendMessage
{
    public class SendMessageDto
    {
        public Guid ChannelId { get; set; }
        public string Content { get; set; }
        public Guid SenderId { get; set; }
        public string? AttachmentUrl { get; set; }
    }
}
