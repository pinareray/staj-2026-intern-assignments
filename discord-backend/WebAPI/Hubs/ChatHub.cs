using Microsoft.AspNetCore.SignalR;
using System.Threading.Tasks;

namespace WebAPI.Hubs
{
    public class ChatHub : Hub
    {
        public async Task JoinChannel(string channelId)
        {
            await Groups.AddToGroupAsync(Context.ConnectionId, channelId);
        }

        public async Task LeaveChannel(string channelId)
        {
            await Groups.RemoveFromGroupAsync(Context.ConnectionId, channelId);
        }

        // Client POST ile kaydettikten sonra bu metodu invoke ederek gruba yayar.
        public async Task SendMessage(string channelId, object message)
        {
            await Clients.Group(channelId).SendAsync("ReceiveMessage", message);
        }
    }
}
