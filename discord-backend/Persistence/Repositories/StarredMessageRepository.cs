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
    public class StarredMessageRepository : IStarredMessageRepository
    {
        private readonly DiscordDbContext _context;

        public StarredMessageRepository(DiscordDbContext context)
        {
            _context = context;
        }

        public async Task<HashSet<Guid>> GetStarredMessageIdsAsync(
            Guid userId,
            IEnumerable<Guid> messageIds)
        {
            var ids = messageIds.ToList();
            if (ids.Count == 0)
            {
                return new HashSet<Guid>();
            }

            var starred = await _context.StarredMessages
                .Where(s => s.UserId == userId && ids.Contains(s.MessageId))
                .Select(s => s.MessageId)
                .ToListAsync();

            return starred.ToHashSet();
        }

        public async Task StarAsync(Guid userId, Guid messageId)
        {
            var exists = await _context.StarredMessages.AnyAsync(s =>
                s.UserId == userId && s.MessageId == messageId);
            if (exists)
            {
                return;
            }

            await _context.StarredMessages.AddAsync(new StarredMessage
            {
                Id = Guid.NewGuid(),
                UserId = userId,
                MessageId = messageId,
                StarredAt = DateTime.UtcNow
            });
            await _context.SaveChangesAsync();
        }

        public async Task UnstarAsync(Guid userId, Guid messageId)
        {
            var row = await _context.StarredMessages.FirstOrDefaultAsync(s =>
                s.UserId == userId && s.MessageId == messageId);
            if (row == null)
            {
                return;
            }

            _context.StarredMessages.Remove(row);
            await _context.SaveChangesAsync();
        }

        public async Task<bool> IsStarredAsync(Guid userId, Guid messageId)
        {
            return await _context.StarredMessages.AnyAsync(s =>
                s.UserId == userId && s.MessageId == messageId);
        }
    }
}
