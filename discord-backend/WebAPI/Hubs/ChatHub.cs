using Application.Repositories;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.SignalR;
using System;
using System.Collections.Concurrent;
using System.Collections.Generic;
using System.Linq;
using System.Security.Claims;
using System.Threading.Tasks;

namespace WebAPI.Hubs
{
    [Authorize]
    public class ChatHub : Hub
    {
        private readonly IUserRepository _userRepository;

        private static readonly ConcurrentDictionary<string, VoiceSeat> VoiceSeats = new();

        private sealed record VoiceSeat(string ChannelId, Guid UserId, string Username);

        public ChatHub(IUserRepository userRepository)
        {
            _userRepository = userRepository;
        }

        public static string UserGroup(Guid userId) => $"user-{userId}";
        public static string VoiceGroup(string channelId) => $"voice-{channelId}";

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

        public async Task JoinVoice(string channelId)
        {
            var userIdValue = Context.User?.FindFirst(ClaimTypes.NameIdentifier)?.Value;
            if (!Guid.TryParse(userIdValue, out var userId))
            {
                return;
            }

            var user = await _userRepository.GetByIdAsync(userId);
            var username = user?.Username ?? "Kullanıcı";

            if (VoiceSeats.TryGetValue(Context.ConnectionId, out var previous) &&
                previous.ChannelId != channelId)
            {
                await Groups.RemoveFromGroupAsync(
                    Context.ConnectionId,
                    VoiceGroup(previous.ChannelId));
                VoiceSeats.TryRemove(Context.ConnectionId, out _);
                await NotifyVoicePeerLeft(previous.ChannelId, previous.UserId);
                await BroadcastVoiceRoster(previous.ChannelId);
            }

            var alreadySeated =
                VoiceSeats.TryGetValue(Context.ConnectionId, out var current) &&
                current.ChannelId == channelId;

            VoiceSeats[Context.ConnectionId] = new VoiceSeat(channelId, userId, username);
            await Groups.AddToGroupAsync(Context.ConnectionId, VoiceGroup(channelId));
            await BroadcastVoiceRoster(channelId);

            if (!alreadySeated)
            {
                await Clients.OthersInGroup(VoiceGroup(channelId)).SendAsync(
                    "VoicePeerJoined",
                    new
                    {
                        channelId,
                        userId,
                        username
                    });
            }
        }

        public async Task LeaveVoice(string channelId)
        {
            if (VoiceSeats.TryRemove(Context.ConnectionId, out var seat) &&
                seat.ChannelId == channelId)
            {
                await Groups.RemoveFromGroupAsync(
                    Context.ConnectionId,
                    VoiceGroup(channelId));
                await NotifyVoicePeerLeft(channelId, seat.UserId);
                await BroadcastVoiceRoster(channelId);
            }
        }

        /// <summary>
        /// WebRTC signaling: offer / answer / ice → hedef kullanıcının ses bağlantılarına.
        /// </summary>
        public async Task SendVoiceSignal(string channelId, string targetUserId, object payload)
        {
            var userIdValue = Context.User?.FindFirst(ClaimTypes.NameIdentifier)?.Value;
            if (!Guid.TryParse(userIdValue, out var fromUserId) ||
                !Guid.TryParse(targetUserId, out var toUserId))
            {
                return;
            }

            if (!VoiceSeats.TryGetValue(Context.ConnectionId, out var seat) ||
                seat.ChannelId != channelId ||
                seat.UserId != fromUserId)
            {
                return;
            }

            var targetConnectionIds = VoiceSeats
                .Where(kv =>
                    kv.Value.ChannelId == channelId &&
                    kv.Value.UserId == toUserId)
                .Select(kv => kv.Key)
                .ToList();

            if (targetConnectionIds.Count == 0)
            {
                return;
            }

            await Clients.Clients(targetConnectionIds).SendAsync(
                "VoiceSignal",
                new
                {
                    channelId,
                    fromUserId,
                    fromUsername = seat.Username,
                    payload
                });
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

        public override async Task OnDisconnectedAsync(Exception? exception)
        {
            if (VoiceSeats.TryRemove(Context.ConnectionId, out var seat))
            {
                await Groups.RemoveFromGroupAsync(
                    Context.ConnectionId,
                    VoiceGroup(seat.ChannelId));

                var stillPresent = VoiceSeats.Values.Any(s =>
                    s.ChannelId == seat.ChannelId && s.UserId == seat.UserId);

                if (!stillPresent)
                {
                    await NotifyVoicePeerLeft(seat.ChannelId, seat.UserId);
                }

                await BroadcastVoiceRoster(seat.ChannelId);
            }

            await base.OnDisconnectedAsync(exception);
        }

        private async Task NotifyVoicePeerLeft(string channelId, Guid userId)
        {
            var stillPresent = VoiceSeats.Values.Any(s =>
                s.ChannelId == channelId && s.UserId == userId);

            if (stillPresent)
            {
                return;
            }

            await Clients.Group(VoiceGroup(channelId)).SendAsync(
                "VoicePeerLeft",
                new { channelId, userId });

            await Clients.Group(channelId).SendAsync(
                "VoicePeerLeft",
                new { channelId, userId });
        }

        private async Task BroadcastVoiceRoster(string channelId)
        {
            var participants = VoiceSeats.Values
                .Where(s => s.ChannelId == channelId)
                .GroupBy(s => s.UserId)
                .Select(g => new
                {
                    userId = g.Key,
                    username = g.First().Username
                })
                .OrderBy(p => p.username)
                .ToList();

            await Clients.Group(VoiceGroup(channelId))
                .SendAsync("VoiceRosterUpdated", new { channelId, participants });

            // Kanal grubundakiler (lobide olmayanlar) da listeyi görsün
            await Clients.Group(channelId)
                .SendAsync("VoiceRosterUpdated", new { channelId, participants });
        }
    }
}
