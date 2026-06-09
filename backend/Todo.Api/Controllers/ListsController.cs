using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Todo.Api.Data;
using Todo.Api.Dtos;

namespace Todo.Api.Controllers;

[ApiController]
[Authorize]
[Route("api/lists")]
public class ListsController(AppDbContext db) : AuthorizedControllerBase
{
    // User's lists (MVP UI uses the first). Create/rename/delete = future
    [HttpGet]
    public async Task<IActionResult> Get()
    {
        var lists = await db.TodoLists
            .Where(l => l.UserId == UserId)
            .OrderBy(l => l.CreatedAt)
            .Select(l => new TodoListDto(l.Id, l.Name))
            .ToListAsync();
        return Ok(lists);
    }
}
