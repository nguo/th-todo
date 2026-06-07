namespace Todo.Api.Models;

// A named list of todo items belonging to a single user. Every user gets a default list
// ("My Tasks") at registration; multi-list management is future work. The owning user is
// referenced by the UserId FK only (no navigation property — we never traverse list -> user).
public class TodoList
{
    public Guid Id { get; set; } = Guid.CreateVersion7();

    public Guid UserId { get; set; }

    public required string Name { get; set; }

    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;
}
