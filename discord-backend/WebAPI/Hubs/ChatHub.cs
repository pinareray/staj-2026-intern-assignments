using Application.Repositories;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.SignalR;
using System;
using System.Security.Claims;
using System.Threading.Tasks;

namespace WebAPI.Hubs
{
    [Authorize]
    public class ChatHub : Hub
    {
        private readonly IUserRepository _userRepository;

        public ChatHub(IUserRepository userRepository)
        {
            _userRepository = userRepository;
        }

        public static string UserGroup(Guid userId) => $"user-{userId}";

        public async Task JoinInbox()
        {
            var userIdValue = Context.User?.FindFirst(ClaimTypes.NameIdentifier)?.Value;
            if (!Guid.TryParse(userIdValue, out var userId))
            {
                return;
            }

            await Groups.AddToGroupAsync(Context.ConnectionId, UserGroup(userId));
        }

        public async Task JoinChannel(string channelId)
        {
            await Groups.AddToGroupAsync(Context.ConnectionId, channelId);
        }

        public async Task LeaveChannel(string channelId)
        {
            await Groups.RemoveFromGroupAsync(Context.ConnectionId, channelId);
        }

        public async Task SendMessage(string channelId, object message)
        {
            await Clients.Group(channelId).SendAsync("ReceiveMessage", message);
        }

        public async Task SendTyping(string channelId)
        {
            var userIdValue = Context.User?.FindFirst(ClaimTypes.NameIdentifier)?.Value;
            if (!Guid.TryParse(userIdValue, out var userId))
            {
                return;
            }

            var user = await _userRepository.GetByIdAsync(userId);
            await Clients.OthersInGroup(channelId).SendAsync("UserTyping", new
            {
                channelId,
                username = user?.Username ?? "Kullanıcı"
            });
        }
    }
}
