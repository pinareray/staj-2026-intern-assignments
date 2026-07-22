using Domain.Entities;
using System;
using System.Collections.Generic;
using System.Threading.Tasks;

namespace Application.Repositories
{
    public interface IFriendshipRepository
    {
        Task AddAsync(Friendship friendship);
        Task UpdateAsync(Friendship friendship);
        Task DeleteAsync(Friendship friendship);
        Task<Friendship?> GetByIdAsync(Guid id);
        Task<Friendship?> GetBetweenUsersAsync(Guid userA, Guid userB);
        Task<List<Friendship>> GetAllBetweenUsersAsync(Guid userA, Guid userB);
        Task DeleteOtherPendingBetweenAsync(Guid userA, Guid userB, Guid keepFriendshipId);
        Task<List<Friendship>> GetForUserAsync(Guid userId);
        Task<List<Friendship>> GetPendingForUserAsync(Guid userId);
        Task<List<Friendship>> GetOutgoingPendingForUserAsync(Guid userId);
    }
}
