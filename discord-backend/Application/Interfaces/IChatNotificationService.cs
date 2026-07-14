using System.Threading.Tasks;

namespace Application.Interfaces
{
    // Aşçı der ki: "Ben bu metodu çağırırım, mesajı kim kime nasıl yayıyor beni ilgilendirmez."
    public interface IChatNotificationService
    {
        Task SendMessageToChannelAsync(string channelId, object messageData);
    }
}
