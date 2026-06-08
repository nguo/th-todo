using System.ComponentModel.DataAnnotations;

namespace Todo.Api.Dtos;

// For record types, ASP.NET model validation reads attributes from the constructor parameter
// (no [property:] target) — [ApiController] then auto-returns 400 on failure.
public record RegisterRequest(
    [Required, StringLength(100, MinimumLength = 3)] string Username,
    [Required, StringLength(200, MinimumLength = 8)] string Password);

public record LoginRequest(
    [Required] string Username,
    [Required] string Password);

public record AuthResponse(string Token, string Username);
