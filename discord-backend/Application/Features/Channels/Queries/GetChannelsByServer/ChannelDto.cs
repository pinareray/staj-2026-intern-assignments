using System;

namespace Application.Features.Channels.Queries.GetChannelsByServer
{
    public class ChannelDto
    {
        public Guid Id { get; set; }
        public string Name { get; set; }
        public Guid? ServerId { get; set; }
        public string Type { get; set; }
    }
}
