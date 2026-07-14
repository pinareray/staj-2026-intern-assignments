using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Design;
using Microsoft.Extensions.Configuration;

namespace Persistence.Contexts
{
    // `dotnet ef` komutlarının DbContext'i ayağa kaldırması için design-time fabrikası.
    public class DiscordDbContextFactory : IDesignTimeDbContextFactory<DiscordDbContext>
    {
        public DiscordDbContext CreateDbContext(string[] args)
        {
            var basePath = Path.GetFullPath(Path.Combine(Directory.GetCurrentDirectory(), "../WebAPI"));
            if (!Directory.Exists(basePath))
            {
                basePath = Path.GetFullPath(Path.Combine(Directory.GetCurrentDirectory(), "WebAPI"));
            }

            var configuration = new ConfigurationBuilder()
                .SetBasePath(basePath)
                .AddJsonFile("appsettings.json", optional: true)
                .AddJsonFile("appsettings.Development.json", optional: true)
                .AddEnvironmentVariables()
                .Build();

            var connectionString = configuration.GetConnectionString("SupabaseConnection")
                ?? throw new InvalidOperationException(
                    "Connection string 'SupabaseConnection' bulunamadı. WebAPI/appsettings.Development.json dosyasını kontrol edin.");

            var optionsBuilder = new DbContextOptionsBuilder<DiscordDbContext>();
            optionsBuilder.UseNpgsql(connectionString);

            return new DiscordDbContext(optionsBuilder.Options);
        }
    }
}
