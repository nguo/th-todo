using System.Security.Claims;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Todo.Api.Auth;
using Todo.Api.Data;
using Todo.Api.Dtos;
using Todo.Api.Models;

namespace Todo.Api.Controllers;

[ApiController]
[Route("api/auth")]
public class AuthController(
    AppDbContext db,
    IPasswordHasher<User> hasher,
    TokenService tokens) : ControllerBase
{
    [HttpPost("register")]
    public async Task<IActionResult> Register(RegisterRequest req)
    {
        var normalized = req.Username.Trim().ToLowerInvariant();
        if (await db.Users.AnyAsync(u => u.NormalizedUsername == normalized))
            return Conflict(new { error = "Username is already taken." });

        var user = new User
        {
            Username = req.Username.Trim(),
            NormalizedUsername = normalized,
            PasswordHash = "", // Replaced below
        };
        user.PasswordHash = hasher.HashPassword(user, req.Password);

        // Default list for new users; same SaveChanges = one transaction
        var defaultList = new TodoList { UserId = user.Id, Name = "My Tasks" };

        db.Users.Add(user);
        db.TodoLists.Add(defaultList);
        await db.SaveChangesAsync();

        var response = new AuthResponse(tokens.CreateToken(user), user.Username);
        return StatusCode(StatusCodes.Status201Created, response);
    }

    [HttpPost("login")]
    public async Task<IActionResult> Login(LoginRequest req)
    {
        var normalized = req.Username.Trim().ToLowerInvariant();
        var user = await db.Users.FirstOrDefaultAsync(u => u.NormalizedUsername == normalized);

        // Generic message either way — don't reveal whether the username exists
        if (user is null ||
            hasher.VerifyHashedPassword(user, user.PasswordHash, req.Password)
                == PasswordVerificationResult.Failed)
        {
            return Unauthorized(new { error = "Invalid username or password." });
        }

        return Ok(new AuthResponse(tokens.CreateToken(user), user.Username));
    }

    // Lets the SPA validate a stored token on load and recover the username
    [Authorize]
    [HttpGet("me")]
    public IActionResult Me() => Ok(new { username = User.FindFirstValue(ClaimTypes.Name) });
}
