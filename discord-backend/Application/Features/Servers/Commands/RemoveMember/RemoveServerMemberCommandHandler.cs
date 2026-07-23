using Application.Common;
using Application.Interfaces;
using Application.Repositories;
using MediatR;
using System;
using System.Threading;
using System.Threading.Tasks;

namespace Application.Features.Servers.Commands.RemoveMember
{
    public class RemoveServerMemberCommandHandler
        : IRequestHandler<RemoveServerMemberCommand, object>
    {
        private readonly IServerRepository _serverRepository;
        private readonly IUserRepository _userRepository;
        private readonly IUserContextService _userContextService;

        public RemoveServerMemberCommandHandler(
            IServerRepository serverRepository,
            IUserRepository userRepository,
            IUserContextService userContextService)
        {
            _serverRepository = serverRepository;
            _userRepository = userRepository;
            _userContextService = userContextService;
        }

        public async Task<object> Handle(
            RemoveServerMemberCommand request,
            CancellationToken cancellationToken)
        {
            var currentUserId = _userContextService.GetCurrentUserId();
            var server = await _serverRepository.GetByIdAsync(request.ServerId)
                ?? throw new Exception("Sunucu bulunamadı.");

            var caller = await _serverRepository.GetMembershipAsync(
                request.ServerId,
                currentUserId);
            if (caller == null || !ServerRoles.CanManageMembers(caller.Role))
            {
                throw new Exception("Üye çıkarmak için sahip veya yönetici olmalısın.");
            }

            if (request.UserId == currentUserId)
            {
                throw new Exception("Kendini sunucudan çıkaramazsın. Ayrıl seçeneğini kullan.");
            }

            var targetMembership = await _serverRepository.GetMembershipAsync(
                request.ServerId,
                request.UserId);
            if (targetMembership == null)
            {
                throw new Exception("Kullanıcı bu sunucunun üyesi değil.");
            }

            if (ServerRoles.IsOwner(targetMembership.Role) || server.OwnerId == request.UserId)
            {
                throw new Exception("Sunucu sahibi çıkarılamaz.");
            }

            // Admin yalnızca normal üyeleri çıkarabilir; Admin'i sadece Owner çıkarır.
            if (ServerRoles.IsAdmin(targetMembership.Role) && !ServerRoles.IsOwner(caller.Role))
            {
                throw new Exception("Yöneticiyi yalnızca sunucu sahibi çıkarabilir.");
            }

            await _serverRepository.RemoveMemberAsync(request.ServerId, request.UserId);

            var user = await _userRepository.GetByIdAsync(request.UserId);

            return new
            {
                userId = request.UserId,
                username = user?.Username,
                serverId = request.ServerId,
                removed = true
            };
        }
    }
}
