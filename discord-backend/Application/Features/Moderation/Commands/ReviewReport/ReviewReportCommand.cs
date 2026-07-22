using MediatR;
using System;

namespace Application.Features.Moderation.Commands.ReviewReport
{
    public class ReviewReportCommand : IRequest<object>
    {
        public Guid ReportId { get; set; }
        /// <summary>Reviewed | Dismissed</summary>
        public string Status { get; set; } = "Reviewed";
        public string? AdminNote { get; set; }
    }
}
