using System;
using System.Threading.Tasks;

namespace Application.Interfaces
{
    // Aşçı der ki: "Ben bu metodu çağırırım, mesajı kim kime nasıl yayıyor beni ilgilendirmez."
    public interface IChatNotificationService
    {
        Task SendMessageToChannelAsync(string channelId, object messageData);
        Task SendReadReceiptAsync(string channelId, object receiptData);
        Task NotifyDmUnreadAsync(Guid userId, object payload);
        Task NotifyMentionAsync(Guid userId, object payload);
        Task NotifyMessageDeletedAsync(string channelId, object payload);
        Task NotifyMessageEditedAsync(string channelId, object payload);
    }
}
