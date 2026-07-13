using Application.Repositories;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;
using Persistence.Contexts;
using Persistence.Repositories;

namespace Persistence
{
    public static class PersistenceServiceRegistration
    {
        // Bu metot, WebAPI (Garson) ayağa kalkarken çağrılacak ve tüm veri tabanı 
        // ayarlarını sisteme yükleyecek.
        public static IServiceCollection AddPersistenceServices(this IServiceCollection services, IConfiguration configuration)
        {
            // 1. Köprüyü (DbContext) sisteme tanıtıyoruz ve PostgreSQL kullanacağını söylüyoruz.
            // (İleride appsettings.json içine Supabase linkimizi yazacağız).
            services.AddDbContext<DiscordDbContext>(options =>
                options.UseNpgsql(configuration.GetConnectionString("SupabaseConnection")));

            // 2. Sözleşme ile İşçiyi birbirine bağlıyoruz.
            // AddScoped: Her gelen HTTP isteğinde (kullanıcı login tuşuna bastığında) 
            // bu işçiden yeni bir tane üret ve işlemi bitince hafızadan sil demek.
            services.AddScoped<IUserRepository, UserRepository>();

            return services;
        }
    }
}