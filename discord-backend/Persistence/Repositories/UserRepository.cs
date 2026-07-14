using Application.Repositories;
using Domain.Entities;
using Microsoft.EntityFrameworkCore;
using Persistence.Contexts;
using System.Threading.Tasks;

namespace Persistence.Repositories
{
    // UserRepository sınıfı, IUserRepository sözleşmesini (interface) "implements" eder (uygular).
    // Yani "O sözleşmedeki şartları ben yerine getireceğim" der.
    public class UserRepository : IUserRepository
    {
        private readonly DiscordDbContext _context;

        // İşçimiz, veri tabanına ulaşabilmek için az önce yazdığımız köprüyü (DbContext) kullanır.
        public UserRepository(DiscordDbContext context)
        {
            _context = context;
        }

        // Sözleşmedeki metodun gerçek kodlarla (SQL karşılığıyla) doldurulmuş hali.
        public async Task<User?> GetByEmailAsync(string email)
        {
            // Entity Framework bu C# kodunu şu SQL sorgusuna çevirir:
            // SELECT * FROM Users WHERE Email = @email LIMIT 1;
            return await _context.Users.FirstOrDefaultAsync(u => u.Email == email);
        }

        public async Task<bool> EmailExistsAsync(string email)
        {
            return await _context.Users.AnyAsync(u => u.Email == email);
        }

        public async Task AddAsync(User user)
        {
            await _context.Users.AddAsync(user);
            await _context.SaveChangesAsync();
        }

        public async Task<User?> GetByResetTokenAsync(string resetToken)
        {
            return await _context.Users.FirstOrDefaultAsync(u => u.PasswordResetToken == resetToken);
        }

        public async Task UpdateAsync(User user)
        {
            _context.Users.Update(user);
            await _context.SaveChangesAsync();
        }
    }
}