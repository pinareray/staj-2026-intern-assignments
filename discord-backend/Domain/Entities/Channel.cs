using System;

namespace Domain.Entities
{
    public class Channel
    {
        public Guid Id { get; set; }
        public string Name { get; set; } = string.Empty;
        /// <summary>Null for DM channels.</summary>
        public Guid? ServerId { get; set; }
        /// <summary>Text | Voice | DM</summary>
        public string Type { get; set; } = "Text";
    }
}
