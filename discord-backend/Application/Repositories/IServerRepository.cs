using Domain.Entities;
using System;
using System.Collections.Generic;
using System.Threading.Tasks;

namespace Application.Repositories
{
    public interface IServerRepository
    {
        Task<List<Server>> GetByUserIdAsync(Guid userId);
        Task CreateWithOwnerAsync(Server server, Guid ownerId);
    }
}
