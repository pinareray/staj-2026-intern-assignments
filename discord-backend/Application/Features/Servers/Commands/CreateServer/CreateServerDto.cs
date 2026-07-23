namespace Application.Features.Servers.Commands.CreateServer
{
    public class CreateServerDto
    {
        public string Name { get; set; } = string.Empty;
        public string? IconUrl { get; set; }
        public string? Template { get; set; }
    }
}
