namespace Todo.Api.Models;

// A registered account. Owns one or more TodoLists.
public class User
{
    // UUIDv7: time-ordered (index-friendly) and mintable on any instance without DB
    // coordination — set here so a new User has its id before SaveChanges.
    public Guid Id { get; set; } = Guid.CreateVersion7();

    // Username as the user typed it (preserved for display).
    public required string Username { get; set; }

    // Lowercased copy used for the case-insensitive uniqueness index. Keeping a separate
    // normalized column (rather than relying on a DB collation) ports cleanly across providers.
    public required string NormalizedUsername { get; set; }

    // PBKDF2 hash from PasswordHasher<User>. Never the plaintext password.
    public required string PasswordHash { get; set; }

    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
}
