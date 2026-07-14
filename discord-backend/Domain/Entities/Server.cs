using System;

namespace Domain.Entities
{
    public class Server
    {
        public Guid Id { get; set; }
        public string Name { get; set; }
        public string? IconUrl { get; set; }
        public Guid OwnerId { get; set; } // Sunucunun sahibi kim?
        public DateTime CreatedAt { get; set; }
    }
}
