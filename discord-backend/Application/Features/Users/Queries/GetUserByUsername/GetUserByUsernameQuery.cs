using MediatR;
using System;
using System.Collections.Generic;

namespace Application.Features.Users.Queries.GetUserByUsername
{
    public class PublicProfileDto
    {
        public Guid Id { get; set; }
        public string Username { get; set; }
        public DateTime CreatedAt { get; set; }
        public string? AvatarUrl { get; set; }
        public string? Bio { get; set; }
        public string? Status { get; set; }
        public int FriendCount { get; set; }
        public int ServerCount { get; set; }
        public bool IsOwnProfile { get; set; }
        public string? Email { get; set; }
        public List<PublicServerDto> Servers { get; set; } = new();
    }

    public class PublicServerDto
    {
        public Guid Id { get; set; }
        public string Name { get; set; }
        public string? IconUrl { get; set; }
    }

    public class GetUserByUsernameQuery : IRequest<PublicProfileDto>
    {
        public string Username { get; set; }
    }
}
