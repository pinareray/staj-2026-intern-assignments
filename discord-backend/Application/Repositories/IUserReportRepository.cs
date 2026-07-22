using Domain.Entities;
using System;
using System.Collections.Generic;
using System.Threading.Tasks;

namespace Application.Repositories
{
    public interface IUserReportRepository
    {
        Task AddAsync(UserReport report);
        Task UpdateAsync(UserReport report);
        Task<UserReport?> GetByIdAsync(Guid id);
        Task<List<UserReport>> GetAllAsync(string? status = null);
    }
}
