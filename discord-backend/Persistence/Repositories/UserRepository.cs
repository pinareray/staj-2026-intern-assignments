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
    public class UserRepository : IUserRepository
    {
        private readonly DiscordDbContext _context;

        public UserRepository(DiscordDbContext context)
        {
            _context = context;
        }

        public async Task<User?> GetByEmailAsync(string email)
        {
            return await _context.Users.FirstOrDefaultAsync(u => u.Email == email);
        }

        public async Task<User?> GetByIdAsync(Guid id)
        {
            return await _context.Users.FirstOrDefaultAsync(u => u.Id == id);
        }

        public async Task<User?> GetByUsernameAsync(string username)
        {
            return await _context.Users.FirstOrDefaultAsync(u =>
                u.Username.ToLower() == username.ToLower());
        }

        public async Task<List<User>> SearchByUsernameAsync(string query, Guid? excludeUserId, int limit = 10)
        {
            var q = query.Trim().ToLower();
            if (string.IsNullOrWhiteSpace(q))
            {
                return new List<User>();
            }

            var users = _context.Users.AsQueryable();
            if (excludeUserId.HasValue)
            {
                users = users.Where(u => u.Id != excludeUserId.Value);
            }

            return await users
                .Where(u => u.Username.ToLower().Contains(q))
                .OrderBy(u => u.Username)
                .Take(limit)
                .ToListAsync();
        }

        public async Task<bool> EmailExistsAsync(string email)
        {
            return await _context.Users.AnyAsync(u => u.Email == email);
        }

        public async Task AddAsync(User user)
        {
            await _context.Users.AddAsync(user);
            await _context.SaveChangesAsync();
        }

        public async Task<User?> GetByResetTokenAsync(string resetToken)
        {
            return await _context.Users.FirstOrDefaultAsync(u => u.PasswordResetToken == resetToken);
        }

        public async Task UpdateAsync(User user)
        {
            _context.Users.Update(user);
            await _context.SaveChangesAsync();
        }

        public async Task DeleteUserAsync(Guid userId)
        {
            var friendships = await _context.Friendships
                .Where(f => f.RequesterId == userId || f.AddresseeId == userId)
                .ToListAsync();
            _context.Friendships.RemoveRange(friendships);

            var starred = await _context.StarredMessages
                .Where(s => s.UserId == userId)
                .ToListAsync();
            _context.StarredMessages.RemoveRange(starred);

            var channelMembers = await _context.ChannelMembers
                .Where(cm => cm.UserId == userId)
                .ToListAsync();
            _context.ChannelMembers.RemoveRange(channelMembers);

            var serverMembers = await _context.ServerMembers
                .Where(sm => sm.UserId == userId)
                .ToListAsync();
            _context.ServerMembers.RemoveRange(serverMembers);

            var messages = await _context.Messages
                .Where(m => m.UserId == userId)
                .ToListAsync();
            _context.Messages.RemoveRange(messages);

            var ownedServers = await _context.Servers
                .Where(s => s.OwnerId == userId)
                .ToListAsync();
            _context.Servers.RemoveRange(ownedServers);

            var user = await _context.Users.FindAsync(userId);
            if (user != null)
            {
                _context.Users.Remove(user);
            }

            await _context.SaveChangesAsync();
        }
    }
}
