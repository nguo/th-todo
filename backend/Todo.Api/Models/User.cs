namespace Todo.Api.Models;

// A registered account; owns one or more TodoLists
public class User
{
    // UUIDv7: time-ordered, mintable without DB coordination — id exists before SaveChanges
    public Guid Id { get; set; } = Guid.CreateVersion7();

    // As typed, preserved for display
    public required string Username { get; set; }

    // Lowercased copy for the uniqueness index; a column (not DB collation) ports across providers
    public required string NormalizedUsername { get; set; }

    // PBKDF2 hash from PasswordHasher<User>, never plaintext
    public required string PasswordHash { get; set; }

    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
}
