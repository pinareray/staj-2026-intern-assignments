using Application.Interfaces;
using Application.Repositories;
using MediatR;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading;
using System.Threading.Tasks;

namespace Application.Features.Servers.Queries.GetServerMembers
{
    public class GetServerMembersQueryHandler : IRequestHandler<GetServerMembersQuery, object>
    {
        private readonly IServerRepository _serverRepository;
        private readonly IUserRepository _userRepository;
        private readonly IUserContextService _userContextService;

        public GetServerMembersQueryHandler(
            IServerRepository serverRepository,
            IUserRepository userRepository,
            IUserContextService userContextService)
        {
            _serverRepository = serverRepository;
            _userRepository = userRepository;
            _userContextService = userContextService;
        }

        public async Task<object> Handle(
            GetServerMembersQuery request,
            CancellationToken cancellationToken)
        {
            var currentUserId = _userContextService.GetCurrentUserId();
            var isMember = await _serverRepository.IsMemberAsync(
                request.ServerId,
                currentUserId);
            if (!isMember)
            {
                throw new Exception("Bu sunucuya erişim yetkiniz yok.");
            }

            var members = await _serverRepository.GetMembersAsync(request.ServerId);
            var items = new List<(Guid userId, string username, string role)>();

            foreach (var member in members)
            {
                var user = await _userRepository.GetByIdAsync(member.UserId);
                if (user == null) continue;

                items.Add((user.Id, user.Username, member.Role));
            }

            return items
                .OrderByDescending(x =>
                    string.Equals(x.role, "Owner", StringComparison.OrdinalIgnoreCase))
                .ThenBy(x => x.username, StringComparer.OrdinalIgnoreCase)
                .Select(x => new
                {
                    userId = x.userId,
                    username = x.username,
                    role = x.role
                })
                .ToList();
        }
    }
}
