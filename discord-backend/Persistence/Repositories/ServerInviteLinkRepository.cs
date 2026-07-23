using Application.Repositories;
using Domain.Entities;
using Microsoft.EntityFrameworkCore;
using Persistence.Contexts;
using System;
using System.Linq;
using System.Threading.Tasks;

namespace Persistence.Repositories
{
    public class ServerInviteLinkRepository : IServerInviteLinkRepository
    {
        private readonly DiscordDbContext _context;

        public ServerInviteLinkRepository(DiscordDbContext context)
        {
            _context = context;
        }

        public async Task AddAsync(ServerInviteLink link)
        {
            await _context.ServerInviteLinks.AddAsync(link);
            await _context.SaveChangesAsync();
        }

        public async Task UpdateAsync(ServerInviteLink link)
        {
            _context.ServerInviteLinks.Update(link);
            await _context.SaveChangesAsync();
        }

        public async Task<ServerInviteLink?> GetByCodeAsync(string code)
        {
            var normalized = code.Trim();
            return await _context.ServerInviteLinks
                .FirstOrDefaultAsync(l => l.Code == normalized);
        }

        public async Task<ServerInviteLink?> GetLatestForServerAsync(Guid serverId)
        {
            return await _context.ServerInviteLinks
                .Where(l => l.ServerId == serverId)
                .OrderByDescending(l => l.CreatedAt)
                .FirstOrDefaultAsync();
        }
    }
}
