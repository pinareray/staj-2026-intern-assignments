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
        public DbSet<Friendship> Friendships { get; set; }
        public DbSet<ChannelMember> ChannelMembers { get; set; }
        public DbSet<StarredMessage> StarredMessages { get; set; }
        public DbSet<ServerInvite> ServerInvites { get; set; }
        public DbSet<ServerInviteLink> ServerInviteLinks { get; set; }
        public DbSet<UserBlock> UserBlocks { get; set; }
        public DbSet<UserReport> UserReports { get; set; }

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
                entity.Property(c => c.ServerId).IsRequired(false);

                entity.HasOne<Server>()
                    .WithMany()
                    .HasForeignKey(c => c.ServerId)
                    .OnDelete(DeleteBehavior.Cascade)
                    .IsRequired(false);
            });

            modelBuilder.Entity<ChannelMember>(entity =>
            {
                entity.HasIndex(cm => new { cm.ChannelId, cm.UserId }).IsUnique();
                entity.HasIndex(cm => cm.UserId);

                entity.HasOne<Channel>()
                    .WithMany()
                    .HasForeignKey(cm => cm.ChannelId)
                    .OnDelete(DeleteBehavior.Cascade);

                entity.HasOne<User>()
                    .WithMany()
                    .HasForeignKey(cm => cm.UserId)
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

            modelBuilder.Entity<Friendship>(entity =>
            {
                entity.HasIndex(f => new { f.RequesterId, f.AddresseeId }).IsUnique();

                entity.HasOne<User>()
                    .WithMany()
                    .HasForeignKey(f => f.RequesterId)
                    .OnDelete(DeleteBehavior.Restrict);

                entity.HasOne<User>()
                    .WithMany()
                    .HasForeignKey(f => f.AddresseeId)
                    .OnDelete(DeleteBehavior.Restrict);
            });

            modelBuilder.Entity<ServerInvite>(entity =>
            {
                entity.HasIndex(i => new { i.ServerId, i.InviteeId, i.Status });
                entity.HasIndex(i => i.InviteeId);

                entity.HasOne<Server>()
                    .WithMany()
                    .HasForeignKey(i => i.ServerId)
                    .OnDelete(DeleteBehavior.Cascade);

                entity.HasOne<User>()
                    .WithMany()
                    .HasForeignKey(i => i.InviterId)
                    .OnDelete(DeleteBehavior.Restrict);

                entity.HasOne<User>()
                    .WithMany()
                    .HasForeignKey(i => i.InviteeId)
                    .OnDelete(DeleteBehavior.Cascade);
            });

            modelBuilder.Entity<ServerInviteLink>(entity =>
            {
                entity.HasIndex(l => l.Code).IsUnique();
                entity.HasIndex(l => l.ServerId);

                entity.Property(l => l.Code).HasMaxLength(32);

                entity.HasOne<Server>()
                    .WithMany()
                    .HasForeignKey(l => l.ServerId)
                    .OnDelete(DeleteBehavior.Cascade);

                entity.HasOne<User>()
                    .WithMany()
                    .HasForeignKey(l => l.CreatedByUserId)
                    .OnDelete(DeleteBehavior.Restrict);
            });

            modelBuilder.Entity<StarredMessage>(entity =>
            {
                entity.HasIndex(s => new { s.UserId, s.MessageId }).IsUnique();
                entity.HasIndex(s => s.MessageId);

                entity.HasOne<User>()
                    .WithMany()
                    .HasForeignKey(s => s.UserId)
                    .OnDelete(DeleteBehavior.Cascade);

                entity.HasOne<Message>()
                    .WithMany()
                    .HasForeignKey(s => s.MessageId)
                    .OnDelete(DeleteBehavior.Cascade);
            });

            modelBuilder.Entity<UserBlock>(entity =>
            {
                entity.HasIndex(b => new { b.BlockerId, b.BlockedId }).IsUnique();
                entity.HasIndex(b => b.BlockedId);

                entity.HasOne<User>()
                    .WithMany()
                    .HasForeignKey(b => b.BlockerId)
                    .OnDelete(DeleteBehavior.Cascade);

                entity.HasOne<User>()
                    .WithMany()
                    .HasForeignKey(b => b.BlockedId)
                    .OnDelete(DeleteBehavior.Cascade);
            });

            modelBuilder.Entity<UserReport>(entity =>
            {
                entity.HasIndex(r => r.Status);
                entity.HasIndex(r => r.ReportedUserId);

                entity.HasOne<User>()
                    .WithMany()
                    .HasForeignKey(r => r.ReporterId)
                    .OnDelete(DeleteBehavior.Restrict);

                entity.HasOne<User>()
                    .WithMany()
                    .HasForeignKey(r => r.ReportedUserId)
                    .OnDelete(DeleteBehavior.Restrict);
            });
        }
    }
}
