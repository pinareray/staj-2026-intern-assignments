using Application.Interfaces;
using Application.Repositories;
using MediatR;
using System.Collections.Generic;
using System.Threading;
using System.Threading.Tasks;

namespace Application.Features.Notifications.Queries.GetNotifications
{
    public class GetNotificationsQueryHandler
        : IRequestHandler<GetNotificationsQuery, object>
    {
        private readonly INotificationRepository _notificationRepository;
        private readonly IUserRepository _userRepository;
        private readonly IUserContextService _userContextService;

        public GetNotificationsQueryHandler(
            INotificationRepository notificationRepository,
            IUserRepository userRepository,
            IUserContextService userContextService)
        {
            _notificationRepository = notificationRepository;
            _userRepository = userRepository;
            _userContextService = userContextService;
        }

        public async Task<object> Handle(
            GetNotificationsQuery request,
            CancellationToken cancellationToken)
        {
            var userId = _userContextService.GetCurrentUserId();
            var items = await _notificationRepository.GetByUserIdAsync(userId);
            var unreadCount = await _notificationRepository.CountUnreadAsync(userId);

            var list = new List<NotificationDto>();
            foreach (var n in items)
            {
                var actor = await _userRepository.GetByIdAsync(n.ActorUserId);
                list.Add(new NotificationDto
                {
                    Id = n.Id,
                    Type = n.Type,
                    ActorUserId = n.ActorUserId,
                    ActorUsername = actor?.Username ?? "Kullanıcı",
                    ServerId = n.ServerId,
                    ChannelId = n.ChannelId,
                    MessageId = n.MessageId,
                    ChannelName = n.ChannelName,
                    Preview = n.Preview,
                    IsRead = n.IsRead,
                    CreatedAt = n.CreatedAt
                });
            }

            return new { unreadCount, items = list };
        }
    }
}
