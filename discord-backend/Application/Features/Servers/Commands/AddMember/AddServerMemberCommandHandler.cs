using Application.Interfaces;
using Application.Repositories;
using Domain.Entities;
using MediatR;
using System;
using System.Threading;
using System.Threading.Tasks;

namespace Application.Features.Servers.Commands.AddMember
{
    public class AddServerMemberCommandHandler : IRequestHandler<AddServerMemberCommand, object>
    {
        private readonly IServerRepository _serverRepository;
        private readonly IServerInviteRepository _inviteRepository;
        private readonly IUserRepository _userRepository;
        private readonly IUserContextService _userContextService;

        public AddServerMemberCommandHandler(
            IServerRepository serverRepository,
            IServerInviteRepository inviteRepository,
            IUserRepository userRepository,
            IUserContextService userContextService)
        {
            _serverRepository = serverRepository;
            _inviteRepository = inviteRepository;
            _userRepository = userRepository;
            _userContextService = userContextService;
        }

        public async Task<object> Handle(AddServerMemberCommand request, CancellationToken cancellationToken)
        {
            if (string.IsNullOrWhiteSpace(request.Username))
            {
                throw new Exception("Kullanıcı adı zorunludur.");
            }

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
                throw new Exception("Bu sunucuya üye davet etme yetkiniz yok.");
            }

            var user = await _userRepository.GetByUsernameAsync(request.Username.Trim().TrimStart('@'));
            if (user == null)
            {
                throw new Exception("Kullanıcı bulunamadı.");
            }

            if (user.Id == currentUserId)
            {
                throw new Exception("Kendinizi davet edemezsiniz.");
            }

            if (await _serverRepository.IsMemberAsync(request.ServerId, user.Id))
            {
                throw new Exception("Bu kullanıcı zaten sunucu üyesi.");
            }

            var existing = await _inviteRepository.GetPendingAsync(request.ServerId, user.Id);
            if (existing != null)
            {
                return new
                {
                    inviteId = existing.Id,
                    userId = user.Id,
                    username = user.Username,
                    serverId = request.ServerId,
                    status = "Pending",
                    alreadyPending = true
                };
            }

            var invite = new ServerInvite
            {
                Id = Guid.NewGuid(),
                ServerId = request.ServerId,
                InviterId = currentUserId,
                InviteeId = user.Id,
                Status = "Pending",
                CreatedAt = DateTime.UtcNow
            };

            await _inviteRepository.AddAsync(invite);

            return new
            {
                inviteId = invite.Id,
                userId = user.Id,
                username = user.Username,
                serverId = request.ServerId,
                status = "Pending",
                alreadyPending = false
            };
        }
    }
}
