using Domain.Entities;
using System;
using System.Collections.Generic;
using System.Threading.Tasks;

namespace Application.Repositories
{
    public interface IMessageRepository
    {
        Task AddAsync(Message message);
        Task<Message?> GetByIdAsync(Guid id);
        Task<List<Message>> GetByChannelIdAsync(Guid channelId);
        Task<Message?> GetLatestByChannelIdAsync(Guid channelId);
        Task<int> CountUnreadInChannelAsync(Guid channelId, Guid excludeUserId, DateTime? after);
    }
}
