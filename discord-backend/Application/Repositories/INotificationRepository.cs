using Domain.Entities;
using System;
using System.Collections.Generic;
using System.Threading.Tasks;

namespace Application.Repositories
{
    public interface INotificationRepository
    {
        Task AddRangeAsync(IEnumerable<Notification> notifications);
        Task<List<Notification>> GetByUserIdAsync(Guid userId, int limit = 50);
        Task<Notification?> GetByIdAsync(Guid id);
        Task UpdateAsync(Notification notification);
        Task MarkAllReadAsync(Guid userId);
        Task<int> CountUnreadAsync(Guid userId);
    }
}
