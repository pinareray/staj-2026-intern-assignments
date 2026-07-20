using System;
using System.Collections.Generic;
using System.Threading.Tasks;

namespace Application.Repositories
{
    public interface IStarredMessageRepository
    {
        Task<HashSet<Guid>> GetStarredMessageIdsAsync(Guid userId, IEnumerable<Guid> messageIds);
        Task StarAsync(Guid userId, Guid messageId);
        Task UnstarAsync(Guid userId, Guid messageId);
        Task<bool> IsStarredAsync(Guid userId, Guid messageId);
    }
}
