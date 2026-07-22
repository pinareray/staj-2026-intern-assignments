using System;

namespace Domain.Entities
{
    /// <summary>Pending | Reviewed | Dismissed</summary>
    public class UserReport
    {
        public Guid Id { get; set; }
        public Guid ReporterId { get; set; }
        public Guid ReportedUserId { get; set; }
        public string Reason { get; set; } = string.Empty;
        public string? Details { get; set; }
        public string Status { get; set; } = "Pending";
        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
        public DateTime? ReviewedAt { get; set; }
        public Guid? ReviewedByAdminId { get; set; }
        public string? AdminNote { get; set; }
    }
}
