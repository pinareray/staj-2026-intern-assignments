using Microsoft.AspNetCore.SignalR;
using System.Threading.Tasks;

namespace WebAPI.Hubs
{
    // Hub sınıfından miras alıyoruz. Bu sayede .NET bunun bir SignalR kulesi olduğunu anlıyor.
    public class ChatHub : Hub
    {
        // Kullanıcı bir kanala (odaya) tıkladığında React Native bu metodu tetikleyecek.
        public async Task JoinChannel(string channelId)
        {
            // Context.ConnectionId: Sisteme o an bağlanan kişinin (telefonun) benzersiz canlı kimliğidir.
            // Onu 'channelId' adındaki sanal odaya (gruba) ekliyoruz.
            await Groups.AddToGroupAsync(Context.ConnectionId, channelId);
        }

        // Kullanıcı kanaldan çıktığında veya başka kanala geçtiğinde bu çalışacak.
        public async Task LeaveChannel(string channelId)
        {
            // Adamı o gruptan çıkarıyoruz ki, o kanala mesaj geldiğinde artık ona gitmesin (boşuna internet harcamasın).
            await Groups.RemoveFromGroupAsync(Context.ConnectionId, channelId);
        }
    }
}