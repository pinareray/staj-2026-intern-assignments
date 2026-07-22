using Application.Interfaces;
using Application.Repositories;
using Domain.Entities;
using MediatR;
using System;
using System.Threading;
using System.Threading.Tasks;

namespace Application.Features.Moderation.Commands.ReportUser
{
    public class ReportUserCommandHandler : IRequestHandler<ReportUserCommand, object>
    {
        private readonly IUserReportRepository _reportRepository;
        private readonly IUserRepository _userRepository;
        private readonly IUserContextService _userContextService;

        public ReportUserCommandHandler(
            IUserReportRepository reportRepository,
            IUserRepository userRepository,
            IUserContextService userContextService)
        {
            _reportRepository = reportRepository;
            _userRepository = userRepository;
            _userContextService = userContextService;
        }

        public async Task<object> Handle(ReportUserCommand request, CancellationToken cancellationToken)
        {
            var currentUserId = _userContextService.GetCurrentUserId();
            if (request.UserId == currentUserId)
            {
                throw new Exception("Kendinizi şikayet edemezsiniz.");
            }

            var reason = (request.Reason ?? "").Trim();
            if (string.IsNullOrWhiteSpace(reason))
            {
                throw new Exception("Şikayet nedeni zorunludur.");
            }

            var target = await _userRepository.GetByIdAsync(request.UserId);
            if (target == null)
            {
                throw new Exception("Kullanıcı bulunamadı.");
            }

            var report = new UserReport
            {
                Id = Guid.NewGuid(),
                ReporterId = currentUserId,
                ReportedUserId = request.UserId,
                Reason = reason,
                Details = string.IsNullOrWhiteSpace(request.Details)
                    ? null
                    : request.Details.Trim(),
                Status = "Pending",
                CreatedAt = DateTime.UtcNow
            };

            await _reportRepository.AddAsync(report);

            return new
            {
                reportId = report.Id,
                status = report.Status
            };
        }
    }
}
