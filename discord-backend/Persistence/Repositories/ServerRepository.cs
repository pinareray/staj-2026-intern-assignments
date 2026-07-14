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
