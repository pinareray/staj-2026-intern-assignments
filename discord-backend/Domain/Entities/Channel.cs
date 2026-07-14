using System;

namespace Domain.Entities
{
    public class Channel
    {
        public Guid Id { get; set; }
        public string Name { get; set; }
        public Guid ServerId { get; set; } // Hangi sunucuya ait?
        public string Type { get; set; } // "Text" mi yoksa "Voice" mu?
    }
}
