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
    public class ServerRepository : IServerRepository
    {
        private readonly DiscordDbContext _context;

        public ServerRepository(DiscordDbContext context)
        {
            _context = context;
        }

        public async Task<Server?> GetByIdAsync(Guid id)
        {
            return await _context.Servers.FirstOrDefaultAsync(s => s.Id == id);
        }

        public async Task<List<Server>> GetByUserIdAsync(Guid userId)
        {
            return await _context.ServerMembers
                .Where(sm => sm.UserId == userId)
                .Join(
                    _context.Servers,
                    member => member.ServerId,
                    server => server.Id,
                    (_, server) => server)
                .OrderBy(s => s.Name)
                .ToListAsync();
        }

        public async Task<bool> IsMemberAsync(Guid serverId, Guid userId)
        {
            return await _context.ServerMembers.AnyAsync(sm =>
                sm.ServerId == serverId && sm.UserId == userId);
        }

        public async Task<ServerMember?> GetMembershipAsync(Guid serverId, Guid userId)
        {
            return await _context.ServerMembers.FirstOrDefaultAsync(sm =>
                sm.ServerId == serverId && sm.UserId == userId);
        }

        public async Task<List<ServerMember>> GetMembersAsync(Guid serverId)
        {
            return await _context.ServerMembers
                .Where(sm => sm.ServerId == serverId)
                .ToListAsync();
        }

        public async Task AddMemberAsync(Guid serverId, Guid userId, string role = "Member")
        {
            var exists = await IsMemberAsync(serverId, userId);
            if (exists)
            {
                return;
            }

            await _context.ServerMembers.AddAsync(new ServerMember
            {
                Id = Guid.NewGuid(),
                ServerId = serverId,
                UserId = userId,
                Role = role
            });
            await _context.SaveChangesAsync();
        }

        public async Task RemoveMemberAsync(Guid serverId, Guid userId)
        {
            var membership = await GetMembershipAsync(serverId, userId);
            if (membership == null)
            {
                return;
            }

            _context.ServerMembers.Remove(membership);
            await _context.SaveChangesAsync();
        }

        public async Task CreateWithOwnerAsync(Server server, Guid ownerId)
        {
            await _context.Servers.AddAsync(server);
            await _context.ServerMembers.AddAsync(new ServerMember
            {
                Id = Guid.NewGuid(),
                ServerId = server.Id,
                UserId = ownerId,
                Role = "Owner"
            });
            await _context.Channels.AddAsync(new Channel
            {
                Id = Guid.NewGuid(),
                Name = "genel",
                ServerId = server.Id,
                Type = "Text"
            });
            await _context.SaveChangesAsync();
        }
    }
}
