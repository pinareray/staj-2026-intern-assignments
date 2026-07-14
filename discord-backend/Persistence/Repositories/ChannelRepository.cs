using Application.Repositories;
using Domain.Entities;
using Microsoft.EntityFrameworkCore;
using Persistence.Contexts;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;

namespace Persistence.Repositories
{
    public class ChannelRepository : IChannelRepository
    {
        private readonly DiscordDbContext _context;

        public ChannelRepository(DiscordDbContext context)
        {
            _context = context;
        }

        public async Task<List<Channel>> GetByServerIdAsync(Guid serverId)
        {
            return await _context.Channels
                .Where(c => c.ServerId == serverId)
                .OrderBy(c => c.Name)
                .ToListAsync();
        }

        public async Task AddAsync(Channel channel)
        {
            await _context.Channels.AddAsync(channel);
            await _context.SaveChangesAsync();
        }
    }
}
