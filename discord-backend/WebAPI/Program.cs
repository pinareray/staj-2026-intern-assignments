using Application.Features.Auth.Commands.Login;
using Infrastructure;
using Persistence;

var builder = WebApplication.CreateBuilder(args);

builder.Services.AddControllers();
builder.Services.AddOpenApi();

// Supabase (PostgreSQL) + repository'ler
builder.Services.AddPersistenceServices(builder.Configuration);

// JWT token helper
builder.Services.AddInfrastructureServices();

// MediatR: Application katmanındaki Login/Register handler'ları
builder.Services.AddMediatR(cfg =>
    cfg.RegisterServicesFromAssembly(typeof(LoginCommand).Assembly));

var app = builder.Build();

if (app.Environment.IsDevelopment())
{
    app.MapOpenApi();
}

app.UseHttpsRedirection();
app.MapControllers();

app.Run();
