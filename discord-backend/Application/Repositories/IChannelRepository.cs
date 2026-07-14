using Domain.Entities;
using System;
using System.Collections.Generic;
using System.Threading.Tasks;

namespace Application.Repositories
{
    public interface IChannelRepository
    {
        Task<List<Channel>> GetByServerIdAsync(Guid serverId);
        Task AddAsync(Channel channel);
    }
}
