using Application.Features.Auth.Commands.Login;
using Application.Interfaces;
using Application.Services;
using Infrastructure;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.EntityFrameworkCore;
using Microsoft.IdentityModel.Tokens;
using Microsoft.OpenApi;
using Persistence;
using Persistence.Contexts;
using System.Text;
using WebAPI.Hubs;
using WebAPI.Services;

var builder = WebApplication.CreateBuilder(args);

builder.Services.AddControllers();
builder.Services.AddEndpointsApiExplorer();

builder.Services.AddSwaggerGen(options =>
{
    options.SwaggerDoc("v1", new OpenApiInfo { Title = "Discord Clone API", Version = "v1" });

    options.AddSecurityDefinition("Bearer", new OpenApiSecurityScheme
    {
        Name = "Authorization",
        Type = SecuritySchemeType.Http,
        Scheme = "bearer",
        BearerFormat = "JWT",
        In = ParameterLocation.Header,
        Description = "JWT token girin. Örnek: eyJhbGciOiJIUzUxMiIsInR5cCI6..."
    });

    options.AddSecurityRequirement(document => new OpenApiSecurityRequirement
    {
        {
            new OpenApiSecuritySchemeReference("Bearer"),
            new List<string>()
        }
    });
});

// React Native / Next.js için CORS — SignalR credentials ile uyumlu spesifik origin'ler.
builder.Services.AddCors(options =>
{
    options.AddPolicy("ClientCors", policy =>
    {
        policy.WithOrigins(
                "http://localhost:3000",
                "http://localhost:3002",
                "http://127.0.0.1:3000",
                "http://127.0.0.1:3002")
              .AllowAnyMethod()
              .AllowAnyHeader()
              .AllowCredentials();
    });
});

var tokenOptions = builder.Configuration.GetSection("TokenOptions");
var securityKey = tokenOptions["SecurityKey"]
    ?? throw new InvalidOperationException("TokenOptions:SecurityKey yapılandırması eksik.");

builder.Services.AddAuthentication(JwtBearerDefaults.AuthenticationScheme)
    .AddJwtBearer(options =>
    {
        options.TokenValidationParameters = new TokenValidationParameters
        {
            ValidateIssuer = true,
            ValidateAudience = true,
            ValidateLifetime = true,
            ValidateIssuerSigningKey = true,
            ValidIssuer = tokenOptions["Issuer"],
            ValidAudience = tokenOptions["Audience"],
            IssuerSigningKey = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(securityKey)),
            ClockSkew = TimeSpan.Zero
        };

        // SignalR WebSocket: access_token query string üzerinden JWT alır.
        options.Events = new JwtBearerEvents
        {
            OnMessageReceived = context =>
            {
                var accessToken = context.Request.Query["access_token"];
                var path = context.HttpContext.Request.Path;
                if (!string.IsNullOrEmpty(accessToken) && path.StartsWithSegments("/chatHub"))
                {
                    context.Token = accessToken;
                }
                return Task.CompletedTask;
            }
        };
    });

builder.Services.AddAuthorization();

builder.Services.AddSignalR();
builder.Services.AddHttpContextAccessor();
builder.Services.AddPersistenceServices(builder.Configuration);
builder.Services.AddInfrastructureServices();
builder.Services.AddScoped<IChatNotificationService, ChatNotificationService>();
builder.Services.AddScoped<IUserContextService, UserContextService>();
builder.Services.AddScoped<IDmChannelService, DmChannelService>();

builder.Services.AddMediatR(cfg =>
    cfg.RegisterServicesFromAssembly(typeof(LoginCommand).Assembly));

var app = builder.Build();

using (var scope = app.Services.CreateScope())
{
    var db = scope.ServiceProvider.GetRequiredService<DiscordDbContext>();
    try
    {
        db.Database.Migrate();
    }
    catch
    {
        // Bazı ortamlarda migration keşfi başarısız olabilir; tabloyu garantiye al.
    }

    db.Database.ExecuteSqlRaw("""
        CREATE TABLE IF NOT EXISTS "Friendships" (
            "Id" uuid NOT NULL,
            "RequesterId" uuid NOT NULL,
            "AddresseeId" uuid NOT NULL,
            "Status" text NOT NULL,
            "CreatedAt" timestamp with time zone NOT NULL,
            CONSTRAINT "PK_Friendships" PRIMARY KEY ("Id"),
            CONSTRAINT "FK_Friendships_Users_RequesterId" FOREIGN KEY ("RequesterId") REFERENCES "Users" ("Id") ON DELETE RESTRICT,
            CONSTRAINT "FK_Friendships_Users_AddresseeId" FOREIGN KEY ("AddresseeId") REFERENCES "Users" ("Id") ON DELETE RESTRICT
        );
        CREATE UNIQUE INDEX IF NOT EXISTS "IX_Friendships_RequesterId_AddresseeId" ON "Friendships" ("RequesterId", "AddresseeId");
        CREATE INDEX IF NOT EXISTS "IX_Friendships_AddresseeId" ON "Friendships" ("AddresseeId");

        ALTER TABLE "Channels" ALTER COLUMN "ServerId" DROP NOT NULL;

        CREATE TABLE IF NOT EXISTS "ChannelMembers" (
            "Id" uuid NOT NULL,
            "ChannelId" uuid NOT NULL,
            "UserId" uuid NOT NULL,
            CONSTRAINT "PK_ChannelMembers" PRIMARY KEY ("Id"),
            CONSTRAINT "FK_ChannelMembers_Channels_ChannelId" FOREIGN KEY ("ChannelId") REFERENCES "Channels" ("Id") ON DELETE CASCADE,
            CONSTRAINT "FK_ChannelMembers_Users_UserId" FOREIGN KEY ("UserId") REFERENCES "Users" ("Id") ON DELETE CASCADE
        );
        CREATE UNIQUE INDEX IF NOT EXISTS "IX_ChannelMembers_ChannelId_UserId" ON "ChannelMembers" ("ChannelId", "UserId");
        CREATE INDEX IF NOT EXISTS "IX_ChannelMembers_UserId" ON "ChannelMembers" ("UserId");

        ALTER TABLE "ChannelMembers" ADD COLUMN IF NOT EXISTS "LastReadAt" timestamp with time zone;

        ALTER TABLE "Users" ADD COLUMN IF NOT EXISTS "Bio" text;
        ALTER TABLE "Users" ADD COLUMN IF NOT EXISTS "Status" text;

        CREATE TABLE IF NOT EXISTS "StarredMessages" (
            "Id" uuid NOT NULL,
            "UserId" uuid NOT NULL,
            "MessageId" uuid NOT NULL,
            "StarredAt" timestamp with time zone NOT NULL,
            CONSTRAINT "PK_StarredMessages" PRIMARY KEY ("Id"),
            CONSTRAINT "FK_StarredMessages_Users_UserId" FOREIGN KEY ("UserId") REFERENCES "Users" ("Id") ON DELETE CASCADE,
            CONSTRAINT "FK_StarredMessages_Messages_MessageId" FOREIGN KEY ("MessageId") REFERENCES "Messages" ("Id") ON DELETE CASCADE
        );
        CREATE UNIQUE INDEX IF NOT EXISTS "IX_StarredMessages_UserId_MessageId" ON "StarredMessages" ("UserId", "MessageId");
        CREATE INDEX IF NOT EXISTS "IX_StarredMessages_MessageId" ON "StarredMessages" ("MessageId");

        ALTER TABLE "Messages" ADD COLUMN IF NOT EXISTS "EditedAt" timestamp with time zone;
        ALTER TABLE "Messages" ADD COLUMN IF NOT EXISTS "AttachmentUrl" text;
        """);
}

if (app.Environment.IsDevelopment())
{
    app.UseSwagger();
    app.UseSwaggerUI(options =>
    {
        options.SwaggerEndpoint("/swagger/v1/swagger.json", "Discord Clone API v1");
        options.RoutePrefix = "swagger";
    });
}

if (!app.Environment.IsDevelopment())
{
    app.UseHttpsRedirection();
}

app.UseCors("ClientCors");
app.UseStaticFiles();
app.UseAuthentication();
app.UseAuthorization();

app.MapGet("/", () => Results.Redirect("/swagger"));
app.MapControllers();
app.MapHub<ChatHub>("/chatHub");

app.Run();
