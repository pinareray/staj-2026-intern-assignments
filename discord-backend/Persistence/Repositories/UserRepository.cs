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
    }
}
