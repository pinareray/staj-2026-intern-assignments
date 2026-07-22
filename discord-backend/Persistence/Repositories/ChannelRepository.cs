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

        public async Task<Channel?> GetByIdAsync(Guid id)
        {
            return await _context.Channels.FirstOrDefaultAsync(c => c.Id == id);
        }

        public async Task<List<Channel>> GetByServerIdAsync(Guid serverId)
        {
            return await _context.Channels
                .Where(c => c.ServerId == serverId)
                .OrderBy(c => c.Name)
                .ToListAsync();
        }

        public async Task<Channel?> FindDmBetweenUsersAsync(Guid userA, Guid userB)
        {
            var channelIdsForA = await _context.ChannelMembers
                .Where(cm => cm.UserId == userA)
                .Select(cm => cm.ChannelId)
                .ToListAsync();

            if (channelIdsForA.Count == 0)
            {
                return null;
            }

            var sharedChannelIds = await _context.ChannelMembers
                .Where(cm => cm.UserId == userB && channelIdsForA.Contains(cm.ChannelId))
                .Select(cm => cm.ChannelId)
                .ToListAsync();

            if (sharedChannelIds.Count == 0)
            {
                return null;
            }

            return await _context.Channels
                .Where(c => c.Type == "DM" && sharedChannelIds.Contains(c.Id))
                .FirstOrDefaultAsync();
        }

        public async Task AddAsync(Channel channel)
        {
            await _context.Channels.AddAsync(channel);
            await _context.SaveChangesAsync();
        }

        public async Task DeleteAsync(Guid id)
        {
            var channel = await _context.Channels.FindAsync(id);
            if (channel == null)
            {
                return;
            }

            _context.Channels.Remove(channel);
            await _context.SaveChangesAsync();
        }
    }
}
