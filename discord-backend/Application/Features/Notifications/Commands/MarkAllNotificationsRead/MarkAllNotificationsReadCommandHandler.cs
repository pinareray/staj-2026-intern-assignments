using Application.Interfaces;
using Application.Repositories;
using MediatR;
using System.Threading;
using System.Threading.Tasks;

namespace Application.Features.Notifications.Commands.MarkAllNotificationsRead
{
    public class MarkAllNotificationsReadCommandHandler
        : IRequestHandler<MarkAllNotificationsReadCommand, object>
    {
        private readonly INotificationRepository _notificationRepository;
        private readonly IUserContextService _userContextService;

        public MarkAllNotificationsReadCommandHandler(
            INotificationRepository notificationRepository,
            IUserContextService userContextService)
        {
            _notificationRepository = notificationRepository;
            _userContextService = userContextService;
        }

        public async Task<object> Handle(
            MarkAllNotificationsReadCommand request,
            CancellationToken cancellationToken)
        {
            var userId = _userContextService.GetCurrentUserId();
            await _notificationRepository.MarkAllReadAsync(userId);
            return new { success = true };
        }
    }
}
