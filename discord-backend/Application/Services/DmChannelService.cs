using Application.Interfaces;
using Application.Repositories;
using Domain.Entities;
using System;
using System.Threading.Tasks;

namespace Application.Services
{
    public class DmChannelService : IDmChannelService
    {
        private readonly IChannelRepository _channelRepository;
        private readonly IChannelMemberRepository _channelMemberRepository;
        private readonly IMessageRepository _messageRepository;
        private readonly IUserRepository _userRepository;

        public DmChannelService(
            IChannelRepository channelRepository,
            IChannelMemberRepository channelMemberRepository,
            IMessageRepository messageRepository,
            IUserRepository userRepository)
        {
            _channelRepository = channelRepository;
            _channelMemberRepository = channelMemberRepository;
            _messageRepository = messageRepository;
            _userRepository = userRepository;
        }

        public async Task<Channel> FindOrCreateDmAsync(
            Guid userA,
            Guid userB,
            bool seedGreeting = false,
            Guid? greetingFromUserId = null)
        {
            var existing = await _channelRepository.FindDmBetweenUsersAsync(userA, userB);
            if (existing != null)
            {
                return existing;
            }

            var otherUser = await _userRepository.GetByIdAsync(userB);
            var channel = new Channel
            {
                Id = Guid.NewGuid(),
                Name = otherUser?.Username ?? "dm",
                ServerId = null,
                Type = "DM"
            };

            await _channelRepository.AddAsync(channel);

            await _channelMemberRepository.AddRangeAsync(new[]
            {
                new ChannelMember
                {
                    Id = Guid.NewGuid(),
                    ChannelId = channel.Id,
                    UserId = userA
                },
                new ChannelMember
                {
                    Id = Guid.NewGuid(),
                    ChannelId = channel.Id,
                    UserId = userB
                }
            });

            if (seedGreeting)
            {
                var fromUserId = greetingFromUserId ?? userA;
                await _messageRepository.AddAsync(new Message
                {
                    Id = Guid.NewGuid(),
                    Content = "Merhaba",
                    UserId = fromUserId,
                    ChannelId = channel.Id,
                    CreatedAt = DateTime.UtcNow
                });
            }

            return channel;
        }
    }
}
