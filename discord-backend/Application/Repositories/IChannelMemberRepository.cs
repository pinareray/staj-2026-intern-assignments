using Domain.Entities;
using System;
using System.Collections.Generic;
using System.Threading.Tasks;

namespace Application.Repositories
{
    public interface IChannelMemberRepository
    {
        Task AddAsync(ChannelMember member);
        Task AddRangeAsync(IEnumerable<ChannelMember> members);
        Task<bool> IsMemberAsync(Guid channelId, Guid userId);
        Task<List<ChannelMember>> GetByUserIdAsync(Guid userId);
        Task<List<ChannelMember>> GetByChannelIdAsync(Guid channelId);
    }
}
