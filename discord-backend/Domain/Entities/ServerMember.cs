using System;

namespace Domain.Entities
{
    // Kullanıcının bir sunucuya üyeliği (many-to-many köprü + rol).
    public class ServerMember
    {
        public Guid Id { get; set; }
        public Guid ServerId { get; set; }
        public Guid UserId { get; set; }
        public string Role { get; set; } // Owner | Admin | Member
    }
}
