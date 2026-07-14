namespace Application.Features.Channels.Commands.CreateChannel
{
    public class CreateChannelDto
    {
        public string Name { get; set; }
        public Guid ServerId { get; set; }
        public string Type { get; set; } = "Text";
    }
}
