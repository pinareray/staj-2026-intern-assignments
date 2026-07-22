using System;

namespace Domain.Entities
{
    /// <summary>Sunucu daveti — Pending kabul edilince ServerMember oluşur.</summary>
    public class ServerInvite
    {
        public Guid Id { get; set; }
        public Guid ServerId { get; set; }
        public Guid InviterId { get; set; }
        public Guid InviteeId { get; set; }
        /// <summary>Pending | Accepted | Rejected</summary>
        public string Status { get; set; } = "Pending";
        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    }
}
