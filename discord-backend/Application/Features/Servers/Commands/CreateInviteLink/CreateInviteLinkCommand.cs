using MediatR;

namespace Application.Features.Servers.Commands.CreateInviteLink
{
    public class CreateInviteLinkCommand : IRequest<CreateInviteLinkResult>
    {
        public Guid ServerId { get; set; }
    }

    public class CreateInviteLinkResult
    {
        public string Code { get; set; } = string.Empty;
        public Guid ServerId { get; set; }
        public string ServerName { get; set; } = string.Empty;
    }
}
