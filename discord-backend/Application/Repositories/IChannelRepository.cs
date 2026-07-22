using Domain.Entities;
using System;
using System.Collections.Generic;
using System.Threading.Tasks;

namespace Application.Repositories
{
    public interface IChannelRepository
    {
        Task<Channel?> GetByIdAsync(Guid id);
        Task<List<Channel>> GetByServerIdAsync(Guid serverId);
        Task<Channel?> FindDmBetweenUsersAsync(Guid userA, Guid userB);
        Task AddAsync(Channel channel);
        Task DeleteAsync(Guid id);
    }
}
