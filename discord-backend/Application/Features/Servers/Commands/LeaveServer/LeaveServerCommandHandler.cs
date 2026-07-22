using Application.Interfaces;
using Application.Repositories;
using MediatR;
using System;
using System.Threading;
using System.Threading.Tasks;

namespace Application.Features.Servers.Commands.LeaveServer
{
    public class LeaveServerCommandHandler : IRequestHandler<LeaveServerCommand, object>
    {
        private readonly IServerRepository _serverRepository;
        private readonly IUserContextService _userContextService;

        public LeaveServerCommandHandler(
            IServerRepository serverRepository,
            IUserContextService userContextService)
        {
            _serverRepository = serverRepository;
            _userContextService = userContextService;
        }

        public async Task<object> Handle(
            LeaveServerCommand request,
            CancellationToken cancellationToken)
        {
            var currentUserId = _userContextService.GetCurrentUserId();
            var server = await _serverRepository.GetByIdAsync(request.ServerId);
            if (server == null)
            {
                throw new Exception("Sunucu bulunamadı.");
            }

            var membership = await _serverRepository.GetMembershipAsync(
                request.ServerId,
                currentUserId);
            if (membership == null)
            {
                throw new Exception("Bu sunucunun üyesi değilsiniz.");
            }

            if (string.Equals(membership.Role, "Owner", StringComparison.OrdinalIgnoreCase) ||
                server.OwnerId == currentUserId)
            {
                throw new Exception("Sunucu sahibi ayrılamaz. Önce sahipliği devretmeli veya sunucuyu silmelisiniz.");
            }

            await _serverRepository.RemoveMemberAsync(request.ServerId, currentUserId);

            return new
            {
                serverId = request.ServerId,
                left = true
            };
        }
    }
}
