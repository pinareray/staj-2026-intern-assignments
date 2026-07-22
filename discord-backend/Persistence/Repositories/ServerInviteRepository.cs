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
    public class ServerInviteRepository : IServerInviteRepository
    {
        private readonly DiscordDbContext _context;

        public ServerInviteRepository(DiscordDbContext context)
        {
            _context = context;
        }

        public async Task AddAsync(ServerInvite invite)
        {
            await _context.ServerInvites.AddAsync(invite);
            await _context.SaveChangesAsync();
        }

        public async Task UpdateAsync(ServerInvite invite)
        {
            _context.ServerInvites.Update(invite);
            await _context.SaveChangesAsync();
        }

        public async Task DeleteAsync(ServerInvite invite)
        {
            _context.ServerInvites.Remove(invite);
            await _context.SaveChangesAsync();
        }

        public async Task<ServerInvite?> GetByIdAsync(Guid id)
        {
            return await _context.ServerInvites.FirstOrDefaultAsync(i => i.Id == id);
        }

        public async Task<ServerInvite?> GetPendingAsync(Guid serverId, Guid inviteeId)
        {
            return await _context.ServerInvites.FirstOrDefaultAsync(i =>
                i.ServerId == serverId &&
                i.InviteeId == inviteeId &&
                i.Status == "Pending");
        }

        public async Task<List<ServerInvite>> GetPendingForInviteeAsync(Guid inviteeId)
        {
            return await _context.ServerInvites
                .Where(i => i.InviteeId == inviteeId && i.Status == "Pending")
                .OrderByDescending(i => i.CreatedAt)
                .ToListAsync();
        }

        public async Task<List<ServerInvite>> GetPendingForServerAsync(Guid serverId)
        {
            return await _context.ServerInvites
                .Where(i => i.ServerId == serverId && i.Status == "Pending")
                .OrderByDescending(i => i.CreatedAt)
                .ToListAsync();
        }
    }
}
