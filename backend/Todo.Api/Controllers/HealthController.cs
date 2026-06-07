using Microsoft.AspNetCore.Mvc;
using Todo.Api.Data;

namespace Todo.Api.Controllers;

// heath check for server
[ApiController]
[Route("api/health")]
public class HealthController(AppDbContext db) : ControllerBase
{
    [HttpGet]
    public async Task<IActionResult> Get()
    {
        var dbConnected = await db.Database.CanConnectAsync();
        return Ok(new
        {
            status = "ok",
            database = dbConnected ? "connected" : "unreachable",
        });
    }
}
