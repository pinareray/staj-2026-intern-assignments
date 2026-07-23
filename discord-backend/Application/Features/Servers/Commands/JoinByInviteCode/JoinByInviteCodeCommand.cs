using MediatR;

namespace Application.Features.Servers.Commands.JoinByInviteCode
{
    public class JoinByInviteCodeCommand : IRequest<JoinByInviteCodeResult>
    {
        public string Code { get; set; } = string.Empty;
    }

    public class JoinByInviteCodeResult
    {
        public Guid ServerId { get; set; }
        public string ServerName { get; set; } = string.Empty;
        public bool AlreadyMember { get; set; }
    }
}
