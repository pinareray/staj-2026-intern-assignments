using Application.Repositories;
using MediatR;
using System.Collections.Generic;
using System.Linq;
using System.Threading;
using System.Threading.Tasks;

namespace Application.Features.Channels.Queries.GetChannelsByServer
{
    public class GetChannelsByServerQueryHandler
        : IRequestHandler<GetChannelsByServerQuery, List<ChannelDto>>
    {
        private readonly IChannelRepository _channelRepository;

        public GetChannelsByServerQueryHandler(IChannelRepository channelRepository)
        {
            _channelRepository = channelRepository;
        }

        public async Task<List<ChannelDto>> Handle(
            GetChannelsByServerQuery request,
            CancellationToken cancellationToken)
        {
            var channels = await _channelRepository.GetByServerIdAsync(request.ServerId);

            return channels.Select(c => new ChannelDto
            {
                Id = c.Id,
                Name = c.Name,
                ServerId = c.ServerId,
                Type = c.Type
            }).ToList();
        }
    }
}
