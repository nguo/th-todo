using System.ComponentModel.DataAnnotations;

namespace Todo.Api.Dtos;

// Attributes use the [property:] target so they land on the generated properties, where
// ASP.NET model validation reads them ([ApiController] auto-returns 400 on failure).
public record RegisterRequest(
    [property: Required, StringLength(100, MinimumLength = 3)] string Username,
    [property: Required, StringLength(200, MinimumLength = 8)] string Password);

public record LoginRequest(
    [property: Required] string Username,
    [property: Required] string Password);

public record AuthResponse(string Token, string Username);
