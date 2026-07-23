using System;

namespace Domain.Entities
{
    public class Notification
    {
        public Guid Id { get; set; }
        public Guid UserId { get; set; }
        /// <summary>mention</summary>
        public string Type { get; set; } = "mention";
        public Guid ActorUserId { get; set; }
        public Guid? ServerId { get; set; }
        public Guid ChannelId { get; set; }
        public Guid MessageId { get; set; }
        public string ChannelName { get; set; } = string.Empty;
        public string? Preview { get; set; }
        public bool IsRead { get; set; }
        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    }
}
