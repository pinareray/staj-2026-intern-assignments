using System;

namespace Domain.Entities
{
    public class StarredMessage
    {
        public Guid Id { get; set; }
        public Guid UserId { get; set; }
        public Guid MessageId { get; set; }
        public DateTime StarredAt { get; set; } = DateTime.UtcNow;
    }
}
