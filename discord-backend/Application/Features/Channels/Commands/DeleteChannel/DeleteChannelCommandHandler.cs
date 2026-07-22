using Application.Common;
using Application.Interfaces;
using Application.Repositories;
using MediatR;
using System;
using System.Threading;
using System.Threading.Tasks;

namespace Application.Features.Channels.Commands.DeleteChannel
{
    public class DeleteChannelCommandHandler : IRequestHandler<DeleteChannelCommand, object>
    {
        private readonly IChannelRepository _channelRepository;
        private readonly IServerRepository _serverRepository;
        private readonly IUserContextService _userContextService;

        public DeleteChannelCommandHandler(
            IChannelRepository channelRepository,
            IServerRepository serverRepository,
            IUserContextService userContextService)
        {
            _channelRepository = channelRepository;
            _serverRepository = serverRepository;
            _userContextService = userContextService;
        }

        public async Task<object> Handle(
            DeleteChannelCommand request,
            CancellationToken cancellationToken)
        {
            var channel = await _channelRepository.GetByIdAsync(request.ChannelId);
            if (channel == null)
            {
                throw new Exception("Kanal bulunamadı.");
            }

            if (string.Equals(channel.Type, "DM", StringComparison.OrdinalIgnoreCase))
            {
                throw new Exception("DM kanalları silinemez.");
            }

            if (channel.ServerId == null || channel.ServerId == Guid.Empty)
            {
                throw new Exception("Geçersiz sunucu kanalı.");
            }

            var currentUserId = _userContextService.GetCurrentUserId();
            var membership = await _serverRepository.GetMembershipAsync(
                channel.ServerId.Value,
                currentUserId);
            if (membership == null)
            {
                throw new Exception("Bu kanalı silme yetkiniz yok.");
            }

            if (!ServerRoles.CanManageChannels(membership.Role))
            {
                throw new Exception("Kanal silmek için Owner veya Admin olmalısınız.");
            }

            await _channelRepository.DeleteAsync(channel.Id);

            return new
            {
                channelId = channel.Id,
                serverId = channel.ServerId,
                deleted = true
            };
        }
    }
}
