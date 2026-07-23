using Domain.Entities;
using System;
using System.Collections.Generic;
using System.Threading.Tasks;

namespace Application.Repositories
{
    public interface IServerRepository
    {
        Task<Server?> GetByIdAsync(Guid id);
        Task<List<Server>> GetByUserIdAsync(Guid userId);
        Task<bool> IsMemberAsync(Guid serverId, Guid userId);
        Task<ServerMember?> GetMembershipAsync(Guid serverId, Guid userId);
        Task<List<ServerMember>> GetMembersAsync(Guid serverId);
        Task AddMemberAsync(Guid serverId, Guid userId, string role = "Member");
        Task RemoveMemberAsync(Guid serverId, Guid userId);
        Task UpdateMemberRoleAsync(Guid serverId, Guid userId, string role);
        Task DeleteServerAsync(Guid serverId);
        Task CreateWithOwnerAsync(
            Server server,
            Guid ownerId,
            IReadOnlyList<(string Name, string Type)>? channels = null);

        Task UpdateAsync(Server server);
    }
}
