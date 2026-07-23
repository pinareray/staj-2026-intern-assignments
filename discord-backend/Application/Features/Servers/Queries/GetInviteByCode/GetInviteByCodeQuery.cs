using MediatR;

namespace Application.Features.Servers.Queries.GetInviteByCode
{
    public class GetInviteByCodeQuery : IRequest<InvitePreviewDto>
    {
        public string Code { get; set; } = string.Empty;
    }

    public class InvitePreviewDto
    {
        public string Code { get; set; } = string.Empty;
        public Guid ServerId { get; set; }
        public string ServerName { get; set; } = string.Empty;
        public bool AlreadyMember { get; set; }
    }
}
