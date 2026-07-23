using Application.Common;
using Application.Interfaces;
using Application.Repositories;
using MediatR;
using System;
using System.Threading;
using System.Threading.Tasks;

namespace Application.Features.Servers.Commands.DeleteServer
{
    public class DeleteServerCommandHandler : IRequestHandler<DeleteServerCommand, object>
    {
        private readonly IServerRepository _serverRepository;
        private readonly IUserContextService _userContextService;

        public DeleteServerCommandHandler(
            IServerRepository serverRepository,
            IUserContextService userContextService)
        {
            _serverRepository = serverRepository;
            _userContextService = userContextService;
        }

        public async Task<object> Handle(
            DeleteServerCommand request,
            CancellationToken cancellationToken)
        {
            var currentUserId = _userContextService.GetCurrentUserId();
            var server = await _serverRepository.GetByIdAsync(request.ServerId)
                ?? throw new Exception("Sunucu bulunamadı.");

            var membership = await _serverRepository.GetMembershipAsync(
                request.ServerId,
                currentUserId);

            var isOwner =
                ServerRoles.CanDeleteServer(membership?.Role) ||
                server.OwnerId == currentUserId;

            if (!isOwner)
            {
                throw new Exception("Sunucuyu yalnızca kurucu silebilir.");
            }

            var name = server.Name;
            await _serverRepository.DeleteServerAsync(request.ServerId);

            return new
            {
                serverId = request.ServerId,
                name,
                deleted = true
            };
        }
    }
}
