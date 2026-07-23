using MediatR;
using System;

namespace Application.Features.Notifications.Commands.MarkNotificationRead
{
    public class MarkNotificationReadCommand : IRequest<object>
    {
        public Guid NotificationId { get; set; }
    }
}
