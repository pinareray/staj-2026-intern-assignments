using Application.Interfaces;
using Application.Repositories;
using MediatR;
using System;
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
        private readonly IFriendshipRepository _friendshipRepository;

        public SearchUsersQueryHandler(
            IUserRepository userRepository,
            IUserContextService userContextService,
            IFriendshipRepository friendshipRepository)
        {
            _userRepository = userRepository;
            _userContextService = userContextService;
            _friendshipRepository = friendshipRepository;
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

            var friendships = await _friendshipRepository.GetForUserAsync(currentUserId);
            var friendIds = friendships
                .Where(f => f.Status == "Accepted")
                .Select(f =>
                    f.RequesterId == currentUserId ? f.AddresseeId : f.RequesterId)
                .ToHashSet();

            return users
                .Select(u => new UserSearchResultDto
                {
                    Id = u.Id,
                    Username = u.Username,
                    IsFriend = friendIds.Contains(u.Id)
                })
                .OrderByDescending(u => u.IsFriend)
                .ThenBy(u => u.Username, StringComparer.OrdinalIgnoreCase)
                .ToList();
        }
    }
}
