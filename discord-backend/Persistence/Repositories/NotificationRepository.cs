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
    public class NotificationRepository : INotificationRepository
    {
        private readonly DiscordDbContext _context;

        public NotificationRepository(DiscordDbContext context)
        {
            _context = context;
        }

        public async Task AddRangeAsync(IEnumerable<Notification> notifications)
        {
            await _context.Notifications.AddRangeAsync(notifications);
            await _context.SaveChangesAsync();
        }

        public async Task<List<Notification>> GetByUserIdAsync(Guid userId, int limit = 50)
        {
            return await _context.Notifications
                .Where(n => n.UserId == userId)
                .OrderByDescending(n => n.CreatedAt)
                .Take(limit)
                .ToListAsync();
        }

        public async Task<Notification?> GetByIdAsync(Guid id)
        {
            return await _context.Notifications.FirstOrDefaultAsync(n => n.Id == id);
        }

        public async Task UpdateAsync(Notification notification)
        {
            _context.Notifications.Update(notification);
            await _context.SaveChangesAsync();
        }

        public async Task MarkAllReadAsync(Guid userId)
        {
            var unread = await _context.Notifications
                .Where(n => n.UserId == userId && !n.IsRead)
                .ToListAsync();
            foreach (var n in unread)
            {
                n.IsRead = true;
            }
            if (unread.Count > 0)
            {
                await _context.SaveChangesAsync();
            }
        }

        public async Task<int> CountUnreadAsync(Guid userId)
        {
            return await _context.Notifications.CountAsync(n => n.UserId == userId && !n.IsRead);
        }
    }
}
