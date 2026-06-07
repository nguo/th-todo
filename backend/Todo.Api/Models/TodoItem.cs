namespace Todo.Api.Models;

// A single task within a TodoList. The owning list is referenced by the ListId FK only
// (no navigation property); ownership by a user is derived through the list.
public class TodoItem
{
    public Guid Id { get; set; } = Guid.CreateVersion7();

    public Guid ListId { get; set; }

    public required string Title { get; set; }

    public bool IsCompleted { get; set; }

    // Order within the list. New items append at max(Position)+1; reorder endpoint is future work.
    public int Position { get; set; }

    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;
}
