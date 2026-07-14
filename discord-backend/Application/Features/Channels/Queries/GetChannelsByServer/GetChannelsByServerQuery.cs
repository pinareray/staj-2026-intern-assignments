using MediatR;
using System;
using System.Collections.Generic;

namespace Application.Features.Channels.Queries.GetChannelsByServer
{
    public class GetChannelsByServerQuery : IRequest<List<ChannelDto>>
    {
        public Guid ServerId { get; set; }
    }
}
