using Application.Security;
using Infrastructure.Security;
using Microsoft.Extensions.DependencyInjection;

namespace Infrastructure
{
    public static class InfrastructureServiceRegistration
    {
        public static IServiceCollection AddInfrastructureServices(this IServiceCollection services)
        {
            // AddScoped: Her istekte bu fabrikadan bir tane oluştur.
            services.AddScoped<ITokenHelper, JwtHelper>();

            return services;
        }
    }
}