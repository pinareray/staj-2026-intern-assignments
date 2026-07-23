using Application.Common;
using Application.Interfaces;
using Application.Repositories;
using MediatR;
using System;
using System.Threading;
using System.Threading.Tasks;

namespace Application.Features.Servers.Commands.UpdateMemberRole
{
    public class UpdateMemberRoleCommandHandler
        : IRequestHandler<UpdateMemberRoleCommand, object>
    {
        private readonly IServerRepository _serverRepository;
        private readonly IUserRepository _userRepository;
        private readonly IUserContextService _userContextService;

        public UpdateMemberRoleCommandHandler(
            IServerRepository serverRepository,
            IUserRepository userRepository,
            IUserContextService userContextService)
        {
            _serverRepository = serverRepository;
            _userRepository = userRepository;
            _userContextService = userContextService;
        }

        public async Task<object> Handle(
            UpdateMemberRoleCommand request,
            CancellationToken cancellationToken)
        {
            var currentUserId = _userContextService.GetCurrentUserId();
            var server = await _serverRepository.GetByIdAsync(request.ServerId)
                ?? throw new Exception("Sunucu bulunamadı.");

            var caller = await _serverRepository.GetMembershipAsync(
                request.ServerId,
                currentUserId);
            if (caller == null || !ServerRoles.CanAssignRoles(caller.Role))
            {
                throw new Exception("Rol vermek yalnızca sunucu sahibine aittir.");
            }

            var nextRole = (request.Role ?? "").Trim();
            if (!string.Equals(nextRole, ServerRoles.Admin, StringComparison.OrdinalIgnoreCase) &&
                !string.Equals(nextRole, ServerRoles.Member, StringComparison.OrdinalIgnoreCase))
            {
                throw new Exception("Rol yalnızca Admin veya Member olabilir.");
            }

            nextRole = string.Equals(nextRole, ServerRoles.Admin, StringComparison.OrdinalIgnoreCase)
                ? ServerRoles.Admin
                : ServerRoles.Member;

            if (request.UserId == currentUserId || server.OwnerId == request.UserId)
            {
                throw new Exception("Sunucu sahibinin rolü değiştirilemez.");
            }

            var target = await _serverRepository.GetMembershipAsync(
                request.ServerId,
                request.UserId);
            if (target == null)
            {
                throw new Exception("Kullanıcı bu sunucunun üyesi değil.");
            }

            if (ServerRoles.IsOwner(target.Role))
            {
                throw new Exception("Sunucu sahibinin rolü değiştirilemez.");
            }

            await _serverRepository.UpdateMemberRoleAsync(
                request.ServerId,
                request.UserId,
                nextRole);

            var user = await _userRepository.GetByIdAsync(request.UserId);

            return new
            {
                userId = request.UserId,
                username = user?.Username,
                serverId = request.ServerId,
                role = nextRole
            };
        }
    }
}
