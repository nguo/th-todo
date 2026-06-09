using Microsoft.EntityFrameworkCore;
using Todo.Api.Models;

namespace Todo.Api.Data;

public class AppDbContext(DbContextOptions<AppDbContext> options) : DbContext(options)
{
    public DbSet<User> Users => Set<User>();
    public DbSet<TodoList> TodoLists => Set<TodoList>();
    public DbSet<TodoItem> TodoItems => Set<TodoItem>();

    // All mapping here, no provider-specific SQL — DB swap = connection string (SQLite dev,
    // Postgres prod)
    protected override void OnModelCreating(ModelBuilder b)
    {
        b.Entity<User>(e =>
        {
            e.Property(u => u.Username).IsRequired().HasMaxLength(100);
            e.Property(u => u.NormalizedUsername).IsRequired().HasMaxLength(100);
            e.Property(u => u.PasswordHash).IsRequired();
            // Case-insensitive uniqueness via the normalized (lowercased) column
            e.HasIndex(u => u.NormalizedUsername).IsUnique();
        });

        b.Entity<TodoList>(e =>
        {
            e.Property(l => l.Name).IsRequired().HasMaxLength(200);
            // FK only, no navigations. Index UserId for lookups; cascade deletes a user's lists
            e.HasOne<User>()
                .WithMany()
                .HasForeignKey(l => l.UserId)
                .OnDelete(DeleteBehavior.Cascade);
            e.HasIndex(l => l.UserId);
        });

        b.Entity<TodoItem>(e =>
        {
            e.Property(i => i.Title).IsRequired().HasMaxLength(500);
            // Index ListId for lookups; cascade deletes a list's items (and via the chain, a user's)
            e.HasOne<TodoList>()
                .WithMany()
                .HasForeignKey(i => i.ListId)
                .OnDelete(DeleteBehavior.Cascade);
            e.HasIndex(i => i.ListId);
        });
    }
}
