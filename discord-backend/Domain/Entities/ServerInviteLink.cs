using System;

namespace Domain.Entities
{
    /// <summary>Paylaşılabilir sunucu davet linki (Discord.gg benzeri kısa kod).</summary>
    public class ServerInviteLink
    {
        public Guid Id { get; set; }
        public Guid ServerId { get; set; }
        public Guid CreatedByUserId { get; set; }
        /// <summary>Kısa benzersiz kod, örn. a7Kx9mQ2</summary>
        public string Code { get; set; } = string.Empty;
        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
        public int UseCount { get; set; }
    }
}
