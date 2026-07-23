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

        public async Task UpdateMemberRoleAsync(Guid serverId, Guid userId, string role)
        {
            var membership = await GetMembershipAsync(serverId, userId);
            if (membership == null)
            {
                throw new Exception("Kullanıcı bu sunucunun üyesi değil.");
            }

            membership.Role = role;
            await _context.SaveChangesAsync();
        }

        public async Task DeleteServerAsync(Guid serverId)
        {
            var server = await _context.Servers.FirstOrDefaultAsync(s => s.Id == serverId);
            if (server == null)
            {
                return;
            }

            var channelIds = await _context.Channels
                .Where(c => c.ServerId == serverId)
                .Select(c => c.Id)
                .ToListAsync();

            if (channelIds.Count > 0)
            {
                var starred = _context.StarredMessages.Where(s =>
                    _context.Messages.Any(m =>
                        m.Id == s.MessageId && channelIds.Contains(m.ChannelId)));
                _context.StarredMessages.RemoveRange(starred);

                var messages = _context.Messages.Where(m => channelIds.Contains(m.ChannelId));
                _context.Messages.RemoveRange(messages);

                var channelMembers = _context.ChannelMembers.Where(cm =>
                    channelIds.Contains(cm.ChannelId));
                _context.ChannelMembers.RemoveRange(channelMembers);

                var channels = _context.Channels.Where(c => c.ServerId == serverId);
                _context.Channels.RemoveRange(channels);
            }

            var members = _context.ServerMembers.Where(sm => sm.ServerId == serverId);
            _context.ServerMembers.RemoveRange(members);

            var invites = _context.ServerInvites.Where(i => i.ServerId == serverId);
            _context.ServerInvites.RemoveRange(invites);

            var inviteLinks = _context.ServerInviteLinks.Where(i => i.ServerId == serverId);
            _context.ServerInviteLinks.RemoveRange(inviteLinks);

            _context.Servers.Remove(server);
            await _context.SaveChangesAsync();
        }

        public async Task CreateWithOwnerAsync(
            Server server,
            Guid ownerId,
            IReadOnlyList<(string Name, string Type)>? channels = null)
        {
            await _context.Servers.AddAsync(server);
            await _context.ServerMembers.AddAsync(new ServerMember
            {
                Id = Guid.NewGuid(),
                ServerId = server.Id,
                UserId = ownerId,
                Role = "Owner"
            });

            var seed = channels is { Count: > 0 }
                ? channels
                : new List<(string Name, string Type)> { ("genel", "Text") };

            foreach (var (name, type) in seed)
            {
                var normalized = name.Trim().ToLowerInvariant().Replace(' ', '-');
                if (string.IsNullOrWhiteSpace(normalized)) continue;

                await _context.Channels.AddAsync(new Channel
                {
                    Id = Guid.NewGuid(),
                    Name = normalized,
                    ServerId = server.Id,
                    Type = string.IsNullOrWhiteSpace(type) ? "Text" : type.Trim()
                });
            }

            await _context.SaveChangesAsync();
        }

        public async Task UpdateAsync(Server server)
        {
            _context.Servers.Update(server);
            await _context.SaveChangesAsync();
        }
    }
}
