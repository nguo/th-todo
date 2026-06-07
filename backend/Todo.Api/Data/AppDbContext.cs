using Microsoft.EntityFrameworkCore;
using Todo.Api.Models;

namespace Todo.Api.Data;

// The gateway to the database.
public class AppDbContext(DbContextOptions<AppDbContext> options) : DbContext(options)
{
    public DbSet<User> Users => Set<User>();
    public DbSet<TodoList> TodoLists => Set<TodoList>();
    public DbSet<TodoItem> TodoItems => Set<TodoItem>();

    // All mapping lives here (no provider-specific SQL) so the database is a drop-in swap
    // via the connection string: SQLite in dev, Postgres/etc. in prod.
    protected override void OnModelCreating(ModelBuilder b)
    {
        b.Entity<User>(e =>
        {
            e.Property(u => u.Username).IsRequired().HasMaxLength(100);
            e.Property(u => u.NormalizedUsername).IsRequired().HasMaxLength(100);
            e.Property(u => u.PasswordHash).IsRequired();
            // Case-insensitive uniqueness enforced on the normalized (lowercased) column.
            e.HasIndex(u => u.NormalizedUsername).IsUnique();
        });

        b.Entity<TodoList>(e =>
        {
            e.Property(l => l.Name).IsRequired().HasMaxLength(200);
            // Relationship by FK only (no navigations). Index UserId for "lists of a user"
            // lookups; cascade so deleting a user removes their lists.
            e.HasOne<User>()
                .WithMany()
                .HasForeignKey(l => l.UserId)
                .OnDelete(DeleteBehavior.Cascade);
            e.HasIndex(l => l.UserId);
        });

        b.Entity<TodoItem>(e =>
        {
            e.Property(i => i.Title).IsRequired().HasMaxLength(500);
            // Index ListId for "items in a list" lookups; cascade so deleting a list (or, via
            // the chain, a user) removes its items.
            e.HasOne<TodoList>()
                .WithMany()
                .HasForeignKey(i => i.ListId)
                .OnDelete(DeleteBehavior.Cascade);
            e.HasIndex(i => i.ListId);
        });
    }
}
