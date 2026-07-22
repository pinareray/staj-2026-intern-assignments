using System;

namespace Domain.Entities
{
    // Kanaldaki bir mesaj kaydı.
    public class Message
    {
        public Guid Id { get; set; }
        public string Content { get; set; }
        public Guid UserId { get; set; }
        public Guid ChannelId { get; set; }
        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
        public DateTime? EditedAt { get; set; }
        public string? AttachmentUrl { get; set; }
    }
}
