using Application.Common;
using Application.Features.Channels.Queries.GetChannelsByServer;
using Application.Interfaces;
using Application.Repositories;
using Domain.Entities;
using MediatR;
using System;
using System.Threading;
using System.Threading.Tasks;

namespace Application.Features.Channels.Commands.CreateChannel
{
    public class CreateChannelCommandHandler : IRequestHandler<CreateChannelCommand, ChannelDto>
    {
        private readonly IChannelRepository _channelRepository;
        private readonly IServerRepository _serverRepository;
        private readonly IUserContextService _userContextService;

        public CreateChannelCommandHandler(
            IChannelRepository channelRepository,
            IServerRepository serverRepository,
            IUserContextService userContextService)
        {
            _channelRepository = channelRepository;
            _serverRepository = serverRepository;
            _userContextService = userContextService;
        }

        public async Task<ChannelDto> Handle(CreateChannelCommand request, CancellationToken cancellationToken)
        {
            if (string.IsNullOrWhiteSpace(request.Name))
            {
                throw new Exception("Kanal adı boş olamaz.");
            }

            if (request.ServerId == Guid.Empty)
            {
                throw new Exception("Sunucu seçilmedi.");
            }

            var userId = _userContextService.GetCurrentUserId();
            var membership = await _serverRepository.GetMembershipAsync(request.ServerId, userId);
            if (membership == null || !ServerRoles.CanManageChannels(membership.Role))
            {
                throw new Exception("Kanal oluşturmak için sahip veya yönetici olmalısın.");
            }

            var type = string.IsNullOrWhiteSpace(request.Type) ? "Text" : request.Type.Trim();

            var channel = new Channel
            {
                Id = Guid.NewGuid(),
                Name = request.Name.Trim().ToLowerInvariant().Replace(' ', '-'),
                ServerId = request.ServerId,
                Type = type
            };

            await _channelRepository.AddAsync(channel);

            return new ChannelDto
            {
                Id = channel.Id,
                Name = channel.Name,
                ServerId = channel.ServerId,
                Type = channel.Type
            };
        }
    }
}
