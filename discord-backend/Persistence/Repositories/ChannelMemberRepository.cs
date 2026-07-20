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
    public class ChannelMemberRepository : IChannelMemberRepository
    {
        private readonly DiscordDbContext _context;

        public ChannelMemberRepository(DiscordDbContext context)
        {
            _context = context;
        }

        public async Task AddAsync(ChannelMember member)
        {
            await _context.ChannelMembers.AddAsync(member);
            await _context.SaveChangesAsync();
        }

        public async Task AddRangeAsync(IEnumerable<ChannelMember> members)
        {
            await _context.ChannelMembers.AddRangeAsync(members);
            await _context.SaveChangesAsync();
        }

        public async Task<bool> IsMemberAsync(Guid channelId, Guid userId)
        {
            return await _context.ChannelMembers.AnyAsync(cm =>
                cm.ChannelId == channelId && cm.UserId == userId);
        }

        public async Task<List<ChannelMember>> GetByUserIdAsync(Guid userId)
        {
            return await _context.ChannelMembers
                .Where(cm => cm.UserId == userId)
                .ToListAsync();
        }

        public async Task<List<ChannelMember>> GetByChannelIdAsync(Guid channelId)
        {
            return await _context.ChannelMembers
                .Where(cm => cm.ChannelId == channelId)
                .ToListAsync();
        }
    }
}
