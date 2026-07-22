using Application.Interfaces;
using Application.Repositories;
using MediatR;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading;
using System.Threading.Tasks;

namespace Application.Features.Dms.Queries.GetDms
{
    public class GetDmsQueryHandler : IRequestHandler<GetDmsQuery, List<DmListItemDto>>
    {
        private readonly IUserContextService _userContextService;
        private readonly IChannelRepository _channelRepository;
        private readonly IChannelMemberRepository _channelMemberRepository;
        private readonly IMessageRepository _messageRepository;
        private readonly IUserRepository _userRepository;
        private readonly IFriendshipRepository _friendshipRepository;

        public GetDmsQueryHandler(
            IUserContextService userContextService,
            IChannelRepository channelRepository,
            IChannelMemberRepository channelMemberRepository,
            IMessageRepository messageRepository,
            IUserRepository userRepository,
            IFriendshipRepository friendshipRepository)
        {
            _userContextService = userContextService;
            _channelRepository = channelRepository;
            _channelMemberRepository = channelMemberRepository;
            _messageRepository = messageRepository;
            _userRepository = userRepository;
            _friendshipRepository = friendshipRepository;
        }

        public async Task<List<DmListItemDto>> Handle(GetDmsQuery request, CancellationToken cancellationToken)
        {
            var currentUserId = _userContextService.GetCurrentUserId();
            var acceptedFriendships = await _friendshipRepository.GetForUserAsync(currentUserId);
            var result = new List<DmListItemDto>();

            foreach (var friendship in acceptedFriendships)
            {
                var friendId = friendship.RequesterId == currentUserId
                    ? friendship.AddresseeId
                    : friendship.RequesterId;

                var user = await _userRepository.GetByIdAsync(friendId);
                var dm = await _channelRepository.FindDmBetweenUsersAsync(currentUserId, friendId);

                string? lastMessage = null;
                DateTime? lastMessageAt = null;
                var unreadCount = 0;

                if (dm != null)
                {
                    var latest = await _messageRepository.GetLatestByChannelIdAsync(dm.Id);
                    lastMessage = latest?.Content;
                    lastMessageAt = latest?.CreatedAt;

                    var membership = await _channelMemberRepository.GetMembershipAsync(
                        dm.Id,
                        currentUserId);
                    unreadCount = await _messageRepository.CountUnreadInChannelAsync(
                        dm.Id,
                        currentUserId,
                        membership?.LastReadAt);
                }

                result.Add(new DmListItemDto
                {
                    ChannelId = dm?.Id,
                    UserId = friendId,
                    Username = user?.Username ?? "Kullanıcı",
                    LastMessage = lastMessage,
                    LastMessageAt = lastMessageAt,
                    UnreadCount = unreadCount
                });
            }

            return result
                .OrderByDescending(d => d.UnreadCount > 0)
                .ThenByDescending(d => d.LastMessageAt ?? DateTime.MinValue)
                .ThenBy(d => d.Username, StringComparer.OrdinalIgnoreCase)
                .ToList();
        }
    }
}
