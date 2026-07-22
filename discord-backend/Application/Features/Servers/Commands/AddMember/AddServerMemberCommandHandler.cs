using Application.Interfaces;
using Application.Repositories;
using MediatR;
using System;
using System.Threading;
using System.Threading.Tasks;

namespace Application.Features.Servers.Commands.AddMember
{
    public class AddServerMemberCommandHandler : IRequestHandler<AddServerMemberCommand, object>
    {
        private readonly IServerRepository _serverRepository;
        private readonly IUserRepository _userRepository;
        private readonly IUserContextService _userContextService;

        public AddServerMemberCommandHandler(
            IServerRepository serverRepository,
            IUserRepository userRepository,
            IUserContextService userContextService)
        {
            _serverRepository = serverRepository;
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
                throw new Exception("Bu sunucuya üye ekleme yetkiniz yok.");
            }

            var user = await _userRepository.GetByUsernameAsync(request.Username.Trim().TrimStart('@'));
            if (user == null)
            {
                throw new Exception("Kullanıcı bulunamadı.");
            }

            if (user.Id == currentUserId)
            {
                throw new Exception("Kendinizi tekrar ekleyemezsiniz.");
            }

            await _serverRepository.AddMemberAsync(request.ServerId, user.Id);

            return new
            {
                userId = user.Id,
                username = user.Username,
                serverId = request.ServerId
            };
        }
    }
}
