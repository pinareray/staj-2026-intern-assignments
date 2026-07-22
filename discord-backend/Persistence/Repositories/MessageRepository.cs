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
    public class MessageRepository : IMessageRepository
    {
        private readonly DiscordDbContext _context;

        public MessageRepository(DiscordDbContext context)
        {
            _context = context;
        }

        public async Task AddAsync(Message message)
        {
            await _context.Messages.AddAsync(message);
            await _context.SaveChangesAsync();
        }

        public async Task UpdateAsync(Message message)
        {
            _context.Messages.Update(message);
            await _context.SaveChangesAsync();
        }

        public async Task DeleteAsync(Guid id)
        {
            var message = await _context.Messages.FindAsync(id);
            if (message == null) return;
            _context.Messages.Remove(message);
            await _context.SaveChangesAsync();
        }

        public async Task<Message?> GetByIdAsync(Guid id)
        {
            return await _context.Messages.FirstOrDefaultAsync(m => m.Id == id);
        }

        public async Task<List<Message>> GetByChannelIdAsync(Guid channelId)
        {
            return await _context.Messages
                .Where(m => m.ChannelId == channelId)
                .OrderBy(m => m.CreatedAt)
                .ToListAsync();
        }

        public async Task<List<Message>> GetPinnedByChannelIdAsync(Guid channelId)
        {
            return await _context.Messages
                .Where(m => m.ChannelId == channelId && m.IsPinned)
                .OrderByDescending(m => m.PinnedAt ?? m.CreatedAt)
                .ToListAsync();
        }

        public async Task<Message?> GetLatestByChannelIdAsync(Guid channelId)
        {
            return await _context.Messages
                .Where(m => m.ChannelId == channelId)
                .OrderByDescending(m => m.CreatedAt)
                .FirstOrDefaultAsync();
        }

        public async Task<int> CountUnreadInChannelAsync(
            Guid channelId,
            Guid excludeUserId,
            DateTime? after)
        {
            var query = _context.Messages.Where(m =>
                m.ChannelId == channelId && m.UserId != excludeUserId);

            if (after.HasValue)
            {
                query = query.Where(m => m.CreatedAt > after.Value);
            }

            return await query.CountAsync();
        }
    }
}
