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
    }
}
