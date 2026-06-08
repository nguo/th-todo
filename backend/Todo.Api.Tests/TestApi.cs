using System.IdentityModel.Tokens.Jwt;
using System.Net.Http.Headers;
using System.Net.Http.Json;
using System.Security.Claims;
using System.Text;
using Microsoft.IdentityModel.Tokens;

namespace Todo.Api.Tests;

// Response shapes for deserialization (ReadFromJsonAsync uses web defaults → case-insensitive,
// so these PascalCase records bind from the API's camelCase JSON).
public record AuthResp(string Token, string Username);
public record MeResp(string Username);
public record ListResp(Guid Id, string Name);
public record ItemResp(
    Guid Id,
    Guid ListId,
    string Title,
    bool IsCompleted,
    int Position,
    DateTime CreatedAt,
    DateTime UpdatedAt);

// Small helpers so each test can register its own user (unique name → tests stay independent
// even though they share one in-memory DB) and act as that user.
public static class TestApi
{
    public static async Task<AuthResp> RegisterAsync(
        this HttpClient client,
        string? username = null,
        string password = "password123")
    {
        username ??= "user_" + Guid.NewGuid().ToString("N")[..12];
        var res = await client.PostAsJsonAsync("/api/auth/register", new { username, password });
        res.EnsureSuccessStatusCode();
        return (await res.Content.ReadFromJsonAsync<AuthResp>())!;
    }

    public static void Authorize(this HttpClient client, string token) =>
        client.DefaultRequestHeaders.Authorization = new AuthenticationHeaderValue("Bearer", token);

    public static async Task<Guid> DefaultListIdAsync(this HttpClient client)
    {
        var lists = await client.GetFromJsonAsync<List<ListResp>>("/api/lists");
        return lists!.Single().Id;
    }

    // Mints a well-formed JWT for negative tests — vary the signing key (wrong signature) or the
    // expiry to exercise the validator. Issuer/audience default to the values the host accepts.
    public static string ForgeJwt(
        string signingKey,
        DateTime expires,
        string issuer = CustomWebApplicationFactory.JwtIssuer,
        string audience = CustomWebApplicationFactory.JwtAudience)
    {
        var creds = new SigningCredentials(
            new SymmetricSecurityKey(Encoding.UTF8.GetBytes(signingKey)),
            SecurityAlgorithms.HmacSha256);
        var token = new JwtSecurityToken(
            issuer,
            audience,
            claims: [new Claim(ClaimTypes.NameIdentifier, Guid.CreateVersion7().ToString())],
            expires: expires,
            signingCredentials: creds);
        return new JwtSecurityTokenHandler().WriteToken(token);
    }
}
