using System;

namespace Domain.Entities
{
    public class ChannelMember
    {
        public Guid Id { get; set; }
        public Guid ChannelId { get; set; }
        public Guid UserId { get; set; }
        public DateTime? LastReadAt { get; set; }
    }
}
