using Application.Interfaces;
using Microsoft.AspNetCore.SignalR;
using System;
using System.Threading.Tasks;
using WebAPI.Hubs;

namespace WebAPI.Services
{
    // Sözleşmeyi (Aşçının butonunu) WebAPI'de bağlıyoruz.
    public class ChatNotificationService : IChatNotificationService
    {
        private readonly IHubContext<ChatHub> _hubContext;

        // IHubContext, ChatHub kulesini dışarıdan (handler'dan) kontrol etmemizi sağlar.
        public ChatNotificationService(IHubContext<ChatHub> hubContext)
        {
            _hubContext = hubContext;
        }

        public async Task SendMessageToChannelAsync(string channelId, object messageData)
        {
            // channelId grubundaki herkese "ReceiveMessage" olayını fırlat.
            await _hubContext.Clients.Group(channelId).SendAsync("ReceiveMessage", messageData);
        }

        public async Task SendReadReceiptAsync(string channelId, object receiptData)
        {
            await _hubContext.Clients.Group(channelId).SendAsync("ReadReceipt", receiptData);
        }

        public async Task NotifyDmUnreadAsync(Guid userId, object payload)
        {
            await _hubContext.Clients
                .Group(ChatHub.UserGroup(userId))
                .SendAsync("DmUnreadUpdated", payload);
        }

        public async Task NotifyMentionAsync(Guid userId, object payload)
        {
            await _hubContext.Clients
                .Group(ChatHub.UserGroup(userId))
                .SendAsync("MentionNotification", payload);
        }

        public async Task NotifyMessageDeletedAsync(string channelId, object payload)
        {
            await _hubContext.Clients.Group(channelId).SendAsync("MessageDeleted", payload);
        }

        public async Task NotifyMessageEditedAsync(string channelId, object payload)
        {
            await _hubContext.Clients.Group(channelId).SendAsync("MessageEdited", payload);
        }
    }
}
