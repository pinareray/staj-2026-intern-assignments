using Domain.Entities;
using System;
using System.Collections.Generic;
using System.Threading.Tasks;

namespace Application.Repositories
{
    public interface IMessageRepository
    {
        Task AddAsync(Message message);
        Task UpdateAsync(Message message);
        Task DeleteAsync(Guid id);
        Task<Message?> GetByIdAsync(Guid id);
        Task<List<Message>> GetByChannelIdAsync(Guid channelId);
        Task<List<Message>> GetPinnedByChannelIdAsync(Guid channelId);
        Task<Message?> GetLatestByChannelIdAsync(Guid channelId);
        Task<int> CountUnreadInChannelAsync(Guid channelId, Guid excludeUserId, DateTime? after);
    }
}
