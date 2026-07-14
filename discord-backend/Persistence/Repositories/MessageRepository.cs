using Application.Repositories;
using Domain.Entities;
using Persistence.Contexts;
using System.Threading.Tasks;

namespace Persistence.Repositories
{
    public class MessageRepository : IMessageRepository
    {
        private readonly DiscordDbContext _context;

        public MessageRepository(DiscordDbContext context)
        {
            _context = context;
        }

        public async Task AddAsync(Message message)
        {
            await _context.Messages.AddAsync(message);
            await _context.SaveChangesAsync();
        }
    }
}
