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
    public class UserReportRepository : IUserReportRepository
    {
        private readonly DiscordDbContext _context;

        public UserReportRepository(DiscordDbContext context)
        {
            _context = context;
        }

        public async Task AddAsync(UserReport report)
        {
            await _context.UserReports.AddAsync(report);
            await _context.SaveChangesAsync();
        }

        public async Task UpdateAsync(UserReport report)
        {
            _context.UserReports.Update(report);
            await _context.SaveChangesAsync();
        }

        public async Task<UserReport?> GetByIdAsync(Guid id)
        {
            return await _context.UserReports.FirstOrDefaultAsync(r => r.Id == id);
        }

        public async Task<List<UserReport>> GetAllAsync(string? status = null)
        {
            var query = _context.UserReports.AsQueryable();
            if (!string.IsNullOrWhiteSpace(status))
            {
                query = query.Where(r => r.Status == status);
            }

            return await query
                .OrderByDescending(r => r.CreatedAt)
                .ToListAsync();
        }
    }
}
