using Application.Interfaces;
using Microsoft.AspNetCore.SignalR;
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
    }
}
