using MediatR;
using System;

namespace Application.Features.Notifications.Queries.GetNotifications
{
    public class GetNotificationsQuery : IRequest<object>
    {
    }

    public class NotificationDto
    {
        public Guid Id { get; set; }
        public string Type { get; set; } = "mention";
        public Guid ActorUserId { get; set; }
        public string ActorUsername { get; set; } = string.Empty;
        public Guid? ServerId { get; set; }
        public Guid ChannelId { get; set; }
        public Guid MessageId { get; set; }
        public string ChannelName { get; set; } = string.Empty;
        public string? Preview { get; set; }
        public bool IsRead { get; set; }
        public DateTime CreatedAt { get; set; }
    }
}
