using MediatR;
using System;
using System.Collections.Generic;

namespace Application.Features.Moderation.Queries.GetReports
{
    public class GetReportsQuery : IRequest<List<ReportDto>>
    {
        public string? Status { get; set; }
    }

    public class ReportDto
    {
        public Guid Id { get; set; }
        public Guid ReporterId { get; set; }
        public string ReporterUsername { get; set; } = string.Empty;
        public Guid ReportedUserId { get; set; }
        public string ReportedUsername { get; set; } = string.Empty;
        public string Reason { get; set; } = string.Empty;
        public string? Details { get; set; }
        public string Status { get; set; } = "Pending";
        public DateTime CreatedAt { get; set; }
        public DateTime? ReviewedAt { get; set; }
        public string? AdminNote { get; set; }
    }
}
