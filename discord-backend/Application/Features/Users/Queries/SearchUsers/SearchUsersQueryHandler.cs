using Application.Interfaces;
using Application.Repositories;
using MediatR;
using System.Collections.Generic;
using System.Linq;
using System.Threading;
using System.Threading.Tasks;

namespace Application.Features.Users.Queries.SearchUsers
{
    public class SearchUsersQueryHandler
        : IRequestHandler<SearchUsersQuery, List<UserSearchResultDto>>
    {
        private readonly IUserRepository _userRepository;
        private readonly IUserContextService _userContextService;

        public SearchUsersQueryHandler(
            IUserRepository userRepository,
            IUserContextService userContextService)
        {
            _userRepository = userRepository;
            _userContextService = userContextService;
        }

        public async Task<List<UserSearchResultDto>> Handle(
            SearchUsersQuery request,
            CancellationToken cancellationToken)
        {
            var currentUserId = _userContextService.GetCurrentUserId();
            var users = await _userRepository.SearchByUsernameAsync(
                request.Query,
                currentUserId,
                10);

            return users
                .Select(u => new UserSearchResultDto
                {
                    Id = u.Id,
                    Username = u.Username
                })
                .ToList();
        }
    }
}
