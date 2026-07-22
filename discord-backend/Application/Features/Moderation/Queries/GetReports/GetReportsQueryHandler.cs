using Application.Interfaces;
using Application.Repositories;
using MediatR;
using System;
using System.Collections.Generic;
using System.Threading;
using System.Threading.Tasks;

namespace Application.Features.Moderation.Queries.GetReports
{
    public class GetReportsQueryHandler : IRequestHandler<GetReportsQuery, List<ReportDto>>
    {
        private readonly IUserReportRepository _reportRepository;
        private readonly IUserRepository _userRepository;
        private readonly IUserContextService _userContextService;

        public GetReportsQueryHandler(
            IUserReportRepository reportRepository,
            IUserRepository userRepository,
            IUserContextService userContextService)
        {
            _reportRepository = reportRepository;
            _userRepository = userRepository;
            _userContextService = userContextService;
        }

        public async Task<List<ReportDto>> Handle(
            GetReportsQuery request,
            CancellationToken cancellationToken)
        {
            if (!_userContextService.IsPlatformAdmin())
            {
                throw new Exception("Bu işlem için platform admin yetkisi gerekir.");
            }

            var reports = await _reportRepository.GetAllAsync(request.Status);
            var result = new List<ReportDto>();

            foreach (var report in reports)
            {
                var reporter = await _userRepository.GetByIdAsync(report.ReporterId);
                var reported = await _userRepository.GetByIdAsync(report.ReportedUserId);
                result.Add(new ReportDto
                {
                    Id = report.Id,
                    ReporterId = report.ReporterId,
                    ReporterUsername = reporter?.Username ?? "Kullanıcı",
                    ReportedUserId = report.ReportedUserId,
                    ReportedUsername = reported?.Username ?? "Kullanıcı",
                    Reason = report.Reason,
                    Details = report.Details,
                    Status = report.Status,
                    CreatedAt = report.CreatedAt,
                    ReviewedAt = report.ReviewedAt,
                    AdminNote = report.AdminNote
                });
            }

            return result;
        }
    }
}
