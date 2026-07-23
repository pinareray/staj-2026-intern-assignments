using Domain.Entities;
using System;
using System.Threading.Tasks;

namespace Application.Repositories
{
    public interface IServerInviteLinkRepository
    {
        Task AddAsync(ServerInviteLink link);
        Task UpdateAsync(ServerInviteLink link);
        Task<ServerInviteLink?> GetByCodeAsync(string code);
        Task<ServerInviteLink?> GetLatestForServerAsync(Guid serverId);
    }
}
