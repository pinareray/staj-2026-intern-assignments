using Domain.Entities;
using Microsoft.EntityFrameworkCore;

namespace Persistence.Contexts
{
    // DbContext, Entity Framework'ün veri tabanıyla iletişim kuran ana sınıfıdır.
    public class DiscordDbContext : DbContext
    {
        // Constructor (Yapıcı Metot): Bağlantı ayarlarını (Connection String) dışarıdan alır.
        public DiscordDbContext(DbContextOptions<DiscordDbContext> options) : base(options)
        {
        }

        // DbSet<User>, kodumuzdaki 'User' sınıfının veritabanında 'Users' adında 
        // bir tabloya karşılık geldiğini sisteme söyler.
        public DbSet<User> Users { get; set; }
    }
}