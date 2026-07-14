using Application.Features.Channels.Queries.GetChannelsByServer;
using MediatR;
using System;

namespace Application.Features.Channels.Commands.CreateChannel
{
    public class CreateChannelCommand : IRequest<ChannelDto>
    {
        public string Name { get; set; }
        public Guid ServerId { get; set; }
        public string Type { get; set; } = "Text";
    }
}
