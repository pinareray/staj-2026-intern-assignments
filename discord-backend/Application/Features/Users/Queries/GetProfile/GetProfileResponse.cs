using System;

namespace Application.Features.Users.Queries.GetProfile
{
    // Şifre alanları bilinçli olarak döndürülmez.
    public class GetProfileResponse
    {
        public Guid Id { get; set; }
        public string Email { get; set; }
        public string Username { get; set; }
        public DateTime CreatedAt { get; set; }
    }
}
