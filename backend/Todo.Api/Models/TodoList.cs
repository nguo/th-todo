namespace Todo.Api.Models;

// A user's named list of todos. Default "My Tasks" at registration; multi-list = future.
// UserId FK only, no nav prop — we never traverse list -> user
public class TodoList
{
    public Guid Id { get; set; } = Guid.CreateVersion7();

    public Guid UserId { get; set; }

    public required string Name { get; set; }

    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;
}
