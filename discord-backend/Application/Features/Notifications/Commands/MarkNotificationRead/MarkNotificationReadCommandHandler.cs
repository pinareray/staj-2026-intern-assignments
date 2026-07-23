using Application.Interfaces;
using Application.Repositories;
using MediatR;
using System;
using System.Threading;
using System.Threading.Tasks;

namespace Application.Features.Notifications.Commands.MarkNotificationRead
{
    public class MarkNotificationReadCommandHandler
        : IRequestHandler<MarkNotificationReadCommand, object>
    {
        private readonly INotificationRepository _notificationRepository;
        private readonly IUserContextService _userContextService;

        public MarkNotificationReadCommandHandler(
            INotificationRepository notificationRepository,
            IUserContextService userContextService)
        {
            _notificationRepository = notificationRepository;
            _userContextService = userContextService;
        }

        public async Task<object> Handle(
            MarkNotificationReadCommand request,
            CancellationToken cancellationToken)
        {
            var userId = _userContextService.GetCurrentUserId();
            var notification = await _notificationRepository.GetByIdAsync(request.NotificationId);
            if (notification == null || notification.UserId != userId)
            {
                throw new Exception("Bildirim bulunamadı.");
            }

            if (!notification.IsRead)
            {
                notification.IsRead = true;
                await _notificationRepository.UpdateAsync(notification);
            }

            return new { id = notification.Id, isRead = true };
        }
    }
}
