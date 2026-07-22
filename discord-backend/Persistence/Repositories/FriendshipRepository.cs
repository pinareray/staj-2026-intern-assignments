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
    public class FriendshipRepository : IFriendshipRepository
    {
        private readonly DiscordDbContext _context;

        public FriendshipRepository(DiscordDbContext context)
        {
            _context = context;
        }

        public async Task AddAsync(Friendship friendship)
        {
            await _context.Friendships.AddAsync(friendship);
            await _context.SaveChangesAsync();
        }

        public async Task UpdateAsync(Friendship friendship)
        {
            _context.Friendships.Update(friendship);
            await _context.SaveChangesAsync();
        }

        public async Task DeleteAsync(Friendship friendship)
        {
            _context.Friendships.Remove(friendship);
            await _context.SaveChangesAsync();
        }

        public async Task<Friendship?> GetByIdAsync(Guid id)
        {
            return await _context.Friendships.FirstOrDefaultAsync(f => f.Id == id);
        }

        public async Task<Friendship?> GetBetweenUsersAsync(Guid userA, Guid userB)
        {
            var rows = await GetAllBetweenUsersAsync(userA, userB);
            return rows.FirstOrDefault(f => f.Status == "Accepted")
                   ?? rows.FirstOrDefault();
        }

        public async Task<List<Friendship>> GetAllBetweenUsersAsync(Guid userA, Guid userB)
        {
            return await _context.Friendships
                .Where(f =>
                    (f.RequesterId == userA && f.AddresseeId == userB) ||
                    (f.RequesterId == userB && f.AddresseeId == userA))
                .ToListAsync();
        }

        public async Task DeleteOtherPendingBetweenAsync(
            Guid userA,
            Guid userB,
            Guid keepFriendshipId)
        {
            var extras = await _context.Friendships
                .Where(f =>
                    f.Id != keepFriendshipId &&
                    f.Status == "Pending" &&
                    ((f.RequesterId == userA && f.AddresseeId == userB) ||
                     (f.RequesterId == userB && f.AddresseeId == userA)))
                .ToListAsync();

            if (extras.Count == 0) return;

            _context.Friendships.RemoveRange(extras);
            await _context.SaveChangesAsync();
        }

        public async Task<List<Friendship>> GetForUserAsync(Guid userId)
        {
            return await _context.Friendships
                .Where(f =>
                    f.Status == "Accepted" &&
                    (f.RequesterId == userId || f.AddresseeId == userId))
                .OrderByDescending(f => f.CreatedAt)
                .ToListAsync();
        }

        public async Task<List<Friendship>> GetPendingForUserAsync(Guid userId)
        {
            return await _context.Friendships
                .Where(f => f.Status == "Pending" && f.AddresseeId == userId)
                .OrderByDescending(f => f.CreatedAt)
                .ToListAsync();
        }

        public async Task<List<Friendship>> GetOutgoingPendingForUserAsync(Guid userId)
        {
            return await _context.Friendships
                .Where(f => f.Status == "Pending" && f.RequesterId == userId)
                .OrderByDescending(f => f.CreatedAt)
                .ToListAsync();
        }
    }
}
