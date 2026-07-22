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
            var server = await _serverRepository.GetByIdAsync(request.ServerId);
            if (server == null)
            {
                throw new Exception("Sunucu bulunamadı.");
            }

            var callerIsMember = await _serverRepository.IsMemberAsync(
                request.ServerId,
                currentUserId);
            if (!callerIsMember)
            {
                throw new Exception("Bu sunucudan üye çıkarma yetkiniz yok.");
            }

            var targetMembership = await _serverRepository.GetMembershipAsync(
                request.ServerId,
                request.UserId);
            if (targetMembership == null)
            {
                throw new Exception("Kullanıcı bu sunucunun üyesi değil.");
            }

            if (string.Equals(targetMembership.Role, "Owner", StringComparison.OrdinalIgnoreCase))
            {
                throw new Exception("Sunucu sahibi çıkarılamaz.");
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
