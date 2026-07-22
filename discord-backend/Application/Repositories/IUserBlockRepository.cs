using Domain.Entities;
using System;
using System.Collections.Generic;
using System.Threading.Tasks;

namespace Application.Repositories
{
    public interface IUserBlockRepository
    {
        Task AddAsync(UserBlock block);
        Task DeleteAsync(UserBlock block);
        Task<UserBlock?> GetAsync(Guid blockerId, Guid blockedId);
        Task<bool> IsBlockedEitherWayAsync(Guid userA, Guid userB);
        Task<List<UserBlock>> GetBlockedByUserAsync(Guid blockerId);
    }
}
