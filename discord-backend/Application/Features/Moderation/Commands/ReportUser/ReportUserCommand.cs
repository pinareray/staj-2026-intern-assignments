using MediatR;
using System;

namespace Application.Features.Moderation.Commands.ReportUser
{
    public class ReportUserCommand : IRequest<object>
    {
        public Guid UserId { get; set; }
        public string Reason { get; set; } = string.Empty;
        public string? Details { get; set; }
    }
}
