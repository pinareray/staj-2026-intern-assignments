using Application.Features.Channels.Queries.GetChannelsByServer;
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

        public CreateChannelCommandHandler(IChannelRepository channelRepository)
        {
            _channelRepository = channelRepository;
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
