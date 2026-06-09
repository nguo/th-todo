namespace Todo.Api.Models;

// A task in a TodoList. ListId FK only, no nav prop; user ownership derived through the list
public class TodoItem
{
    public Guid Id { get; set; } = Guid.CreateVersion7();

    public Guid ListId { get; set; }

    public required string Title { get; set; }

    public bool IsCompleted { get; set; }

    // Order in the list. New items append at max(Position)+1; reorder = future
    public int Position { get; set; }

    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;
}
