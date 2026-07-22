using System;

namespace Application.Features.Messages.Queries.GetMessagesByChannel
{
    public class MessageDto
    {
        public Guid Id { get; set; }
        public string Content { get; set; }
        public Guid UserId { get; set; }
        public string Username { get; set; }
        public Guid ChannelId { get; set; }
        public DateTime CreatedAt { get; set; }
        public DateTime? EditedAt { get; set; }
        public string? AttachmentUrl { get; set; }
        public bool IsStarred { get; set; }
    }
}
