using Domain.Entities;
using System;
using System.Collections.Generic;
using System.Threading.Tasks;

namespace Application.Repositories
{
    public interface IServerInviteRepository
    {
        Task AddAsync(ServerInvite invite);
        Task UpdateAsync(ServerInvite invite);
        Task DeleteAsync(ServerInvite invite);
        Task<ServerInvite?> GetByIdAsync(Guid id);
        Task<ServerInvite?> GetPendingAsync(Guid serverId, Guid inviteeId);
        Task<List<ServerInvite>> GetPendingForInviteeAsync(Guid inviteeId);
        Task<List<ServerInvite>> GetPendingForServerAsync(Guid serverId);
    }
}
