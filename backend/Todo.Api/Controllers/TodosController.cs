using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Todo.Api.Data;
using Todo.Api.Dtos;
using Todo.Api.Models;

namespace Todo.Api.Controllers;

// Nested under the list so multi-list later is non-breaking. Every action first confirms the
// list belongs to the caller (404 otherwise — don't leak existence), then scopes to that list.
[ApiController]
[Authorize]
[Route("api/lists/{listId:guid}/todos")]
public class TodosController(AppDbContext db) : AuthorizedControllerBase
{
    private Task<bool> OwnsListAsync(Guid listId) =>
        db.TodoLists.AnyAsync(l => l.Id == listId && l.UserId == UserId);

    [HttpGet]
    public async Task<IActionResult> Get(Guid listId)
    {
        if (!await OwnsListAsync(listId)) return NotFound();

        var items = await db.TodoItems
            .Where(i => i.ListId == listId)
            .OrderBy(i => i.Position).ThenBy(i => i.Id)
            .Select(i => new TodoItemDto(
                i.Id, i.ListId, i.Title, i.IsCompleted, i.Position, i.CreatedAt, i.UpdatedAt))
            .ToListAsync();
        return Ok(items);
    }

    [HttpPost]
    public async Task<IActionResult> Create(Guid listId, CreateTodoRequest req)
    {
        if (!await OwnsListAsync(listId)) return NotFound();

        // Append at the end of the list.
        var maxPosition = await db.TodoItems
            .Where(i => i.ListId == listId)
            .MaxAsync(i => (int?)i.Position) ?? -1;

        var item = new TodoItem
        {
            ListId = listId,
            Title = req.Title.Trim(),
            Position = maxPosition + 1,
        };
        db.TodoItems.Add(item);
        await db.SaveChangesAsync();

        return StatusCode(StatusCodes.Status201Created, ToDto(item));
    }

    // Edit text and/or completion. Send either field (or both); omitted fields are unchanged.
    [HttpPut("{id:guid}")]
    public async Task<IActionResult> Update(Guid listId, Guid id, UpdateTodoRequest req)
    {
        if (!await OwnsListAsync(listId)) return NotFound();

        var item = await db.TodoItems.FirstOrDefaultAsync(i => i.Id == id && i.ListId == listId);
        if (item is null) return NotFound();

        if (req.Title is not null) item.Title = req.Title.Trim();
        if (req.IsCompleted is not null) item.IsCompleted = req.IsCompleted.Value;
        item.UpdatedAt = DateTime.UtcNow;
        await db.SaveChangesAsync();

        return Ok(ToDto(item));
    }

    [HttpDelete("{id:guid}")]
    public async Task<IActionResult> Delete(Guid listId, Guid id)
    {
        if (!await OwnsListAsync(listId)) return NotFound();

        var item = await db.TodoItems.FirstOrDefaultAsync(i => i.Id == id && i.ListId == listId);
        if (item is null) return NotFound();

        db.TodoItems.Remove(item);
        await db.SaveChangesAsync();
        return NoContent();
    }

    private static TodoItemDto ToDto(TodoItem i) =>
        new(i.Id, i.ListId, i.Title, i.IsCompleted, i.Position, i.CreatedAt, i.UpdatedAt);
}
