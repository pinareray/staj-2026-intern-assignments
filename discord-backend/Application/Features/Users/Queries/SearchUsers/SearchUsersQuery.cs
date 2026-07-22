using MediatR;
using System;
using System.Collections.Generic;

namespace Application.Features.Users.Queries.SearchUsers
{
    public class UserSearchResultDto
    {
        public Guid Id { get; set; }
        public string Username { get; set; } = string.Empty;
        public bool IsFriend { get; set; }
    }

    public class SearchUsersQuery : IRequest<List<UserSearchResultDto>>
    {
        public string Query { get; set; } = string.Empty;
    }
}
