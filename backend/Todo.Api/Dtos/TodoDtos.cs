using System.ComponentModel.DataAnnotations;

namespace Todo.Api.Dtos;

public record TodoListDto(Guid Id, string Name);

public record TodoItemDto(
    Guid Id,
    Guid ListId,
    string Title,
    bool IsCompleted,
    int Position,
    DateTime CreatedAt,
    DateTime UpdatedAt);

public record CreateTodoRequest(
    [Required, StringLength(500, MinimumLength = 1)] string Title);

// Both fields optional: send Title to rename, IsCompleted to (un)complete, or both.
public record UpdateTodoRequest(
    [StringLength(500, MinimumLength = 1)] string? Title,
    bool? IsCompleted);
