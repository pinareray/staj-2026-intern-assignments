using MediatR;
using System;

namespace Application.Features.Users.Queries.GetUserByUsername
{
    public class PublicProfileDto
    {
        public Guid Id { get; set; }
        public string Username { get; set; }
        public DateTime CreatedAt { get; set; }
        public string? AvatarUrl { get; set; }
    }

    public class GetUserByUsernameQuery : IRequest<PublicProfileDto>
    {
        public string Username { get; set; }
    }
}
