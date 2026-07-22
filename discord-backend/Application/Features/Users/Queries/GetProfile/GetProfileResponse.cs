using System;

namespace Application.Features.Users.Queries.GetProfile
{
    public class GetProfileResponse
    {
        public Guid Id { get; set; }
        public string Email { get; set; }
        public string Username { get; set; }
        public DateTime CreatedAt { get; set; }
        public string? Bio { get; set; }
        public string? Status { get; set; }
        public int FriendCount { get; set; }
        public int ServerCount { get; set; }
        public bool IsPlatformAdmin { get; set; }
    }
}
