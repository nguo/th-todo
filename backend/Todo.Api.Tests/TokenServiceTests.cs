using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using System.Text;
using Microsoft.Extensions.Options;
using Microsoft.IdentityModel.Tokens;
using Todo.Api.Auth;
using Todo.Api.Models;

namespace Todo.Api.Tests;

// Pure unit test (no web host): a created token validates and carries the user's identity.
public class TokenServiceTests
{
    [Fact]
    public void CreateToken_embeds_user_id_and_username()
    {
        var opt = new JwtOptions
        {
            Key = "unit-test-signing-key-which-is-long-enough-0123456789",
            Issuer = "todo-api-test",
            Audience = "todo-app-test",
            ExpiryMinutes = 60,
        };
        var service = new TokenService(Options.Create(opt));
        var user = new User { Username = "Alice", NormalizedUsername = "alice", PasswordHash = "x" };

        var token = service.CreateToken(user);

        // Validate the same way the app does; inbound mapping restores ClaimTypes.* so we assert
        // on identity rather than the short JWT claim names (implementation detail).
        var principal = new JwtSecurityTokenHandler().ValidateToken(
            token,
            new TokenValidationParameters
            {
                ValidateIssuer = true,
                ValidIssuer = opt.Issuer,
                ValidateAudience = true,
                ValidAudience = opt.Audience,
                ValidateIssuerSigningKey = true,
                IssuerSigningKey = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(opt.Key)),
                ValidateLifetime = true,
            },
            out _);

        Assert.Equal(user.Id.ToString(), principal.FindFirstValue(ClaimTypes.NameIdentifier));
        Assert.Equal("Alice", principal.FindFirstValue(ClaimTypes.Name));
    }
}
