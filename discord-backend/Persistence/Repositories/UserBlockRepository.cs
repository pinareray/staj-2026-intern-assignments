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
    public class UserBlockRepository : IUserBlockRepository
    {
        private readonly DiscordDbContext _context;

        public UserBlockRepository(DiscordDbContext context)
        {
            _context = context;
        }

        public async Task AddAsync(UserBlock block)
        {
            await _context.UserBlocks.AddAsync(block);
            await _context.SaveChangesAsync();
        }

        public async Task DeleteAsync(UserBlock block)
        {
            _context.UserBlocks.Remove(block);
            await _context.SaveChangesAsync();
        }

        public async Task<UserBlock?> GetAsync(Guid blockerId, Guid blockedId)
        {
            return await _context.UserBlocks.FirstOrDefaultAsync(b =>
                b.BlockerId == blockerId && b.BlockedId == blockedId);
        }

        public async Task<bool> IsBlockedEitherWayAsync(Guid userA, Guid userB)
        {
            return await _context.UserBlocks.AnyAsync(b =>
                (b.BlockerId == userA && b.BlockedId == userB) ||
                (b.BlockerId == userB && b.BlockedId == userA));
        }

        public async Task<List<UserBlock>> GetBlockedByUserAsync(Guid blockerId)
        {
            return await _context.UserBlocks
                .Where(b => b.BlockerId == blockerId)
                .OrderByDescending(b => b.CreatedAt)
                .ToListAsync();
        }
    }
}
