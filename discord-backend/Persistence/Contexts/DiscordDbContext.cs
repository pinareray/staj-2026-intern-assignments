using Domain.Entities;
using Microsoft.EntityFrameworkCore;

namespace Persistence.Contexts
{
    // DbContext, Entity Framework'ün veri tabanıyla iletişim kuran ana sınıfıdır.
    public class DiscordDbContext : DbContext
    {
        public DiscordDbContext(DbContextOptions<DiscordDbContext> options) : base(options)
        {
        }

        public DbSet<User> Users { get; set; }
        public DbSet<Server> Servers { get; set; }
        public DbSet<Channel> Channels { get; set; }
        public DbSet<ServerMember> ServerMembers { get; set; }
        public DbSet<Message> Messages { get; set; }

        protected override void OnModelCreating(ModelBuilder modelBuilder)
        {
            base.OnModelCreating(modelBuilder);

            modelBuilder.Entity<User>(entity =>
            {
                entity.HasIndex(u => u.Email).IsUnique();
            });

            modelBuilder.Entity<Server>(entity =>
            {
                entity.Property(s => s.IconUrl).IsRequired(false);

                entity.HasOne<User>()
                    .WithMany()
                    .HasForeignKey(s => s.OwnerId)
                    .OnDelete(DeleteBehavior.Restrict);
            });

            modelBuilder.Entity<Channel>(entity =>
            {
                entity.HasOne<Server>()
                    .WithMany()
                    .HasForeignKey(c => c.ServerId)
                    .OnDelete(DeleteBehavior.Cascade);
            });

            modelBuilder.Entity<ServerMember>(entity =>
            {
                entity.HasIndex(sm => new { sm.ServerId, sm.UserId }).IsUnique();

                entity.HasOne<Server>()
                    .WithMany()
                    .HasForeignKey(sm => sm.ServerId)
                    .OnDelete(DeleteBehavior.Cascade);

                entity.HasOne<User>()
                    .WithMany()
                    .HasForeignKey(sm => sm.UserId)
                    .OnDelete(DeleteBehavior.Cascade);
            });

            modelBuilder.Entity<Message>(entity =>
            {
                entity.HasOne<User>()
                    .WithMany()
                    .HasForeignKey(m => m.UserId)
                    .OnDelete(DeleteBehavior.Restrict);

                entity.HasOne<Channel>()
                    .WithMany()
                    .HasForeignKey(m => m.ChannelId)
                    .OnDelete(DeleteBehavior.Cascade);
            });
        }
    }
}
