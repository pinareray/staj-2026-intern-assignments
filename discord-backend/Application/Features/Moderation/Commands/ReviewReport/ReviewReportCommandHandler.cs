using Application.Interfaces;
using Application.Repositories;
using MediatR;
using System;
using System.Threading;
using System.Threading.Tasks;

namespace Application.Features.Moderation.Commands.ReviewReport
{
    public class ReviewReportCommandHandler : IRequestHandler<ReviewReportCommand, object>
    {
        private readonly IUserReportRepository _reportRepository;
        private readonly IUserContextService _userContextService;

        public ReviewReportCommandHandler(
            IUserReportRepository reportRepository,
            IUserContextService userContextService)
        {
            _reportRepository = reportRepository;
            _userContextService = userContextService;
        }

        public async Task<object> Handle(ReviewReportCommand request, CancellationToken cancellationToken)
        {
            if (!_userContextService.IsPlatformAdmin())
            {
                throw new Exception("Bu işlem için platform admin yetkisi gerekir.");
            }

            var status = (request.Status ?? "").Trim();
            if (status is not ("Reviewed" or "Dismissed"))
            {
                throw new Exception("Geçersiz durum. Reviewed veya Dismissed olmalı.");
            }

            var report = await _reportRepository.GetByIdAsync(request.ReportId);
            if (report == null)
            {
                throw new Exception("Şikayet bulunamadı.");
            }

            report.Status = status;
            report.ReviewedAt = DateTime.UtcNow;
            report.ReviewedByAdminId = _userContextService.GetCurrentUserId();
            report.AdminNote = string.IsNullOrWhiteSpace(request.AdminNote)
                ? null
                : request.AdminNote.Trim();

            await _reportRepository.UpdateAsync(report);

            return new
            {
                report.Id,
                report.Status,
                report.ReviewedAt,
                report.AdminNote
            };
        }
    }
}
