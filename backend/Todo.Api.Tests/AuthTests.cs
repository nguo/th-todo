using System.Net;
using System.Net.Http.Json;

namespace Todo.Api.Tests;

public class AuthTests(CustomWebApplicationFactory factory) : IClassFixture<CustomWebApplicationFactory>
{
    [Fact]
    public async Task Register_returns_token_and_creates_one_usable_default_list()
    {
        var client = factory.CreateClient();
        var auth = await client.RegisterAsync();
        Assert.False(string.IsNullOrWhiteSpace(auth.Token));

        client.Authorize(auth.Token);

        // Exactly one default list is created (name is cosmetic, so we don't assert it)...
        var lists = await client.GetFromJsonAsync<List<ListResp>>("/api/lists");
        var list = Assert.Single(lists!);
        Assert.NotEqual(Guid.Empty, list.Id);

        // ...and it's a real, usable list: its (empty) todos are queryable.
        var todos = await client.GetFromJsonAsync<List<ItemResp>>($"/api/lists/{list.Id}/todos");
        Assert.Empty(todos!);
    }

    [Fact]
    public async Task Register_duplicate_username_is_conflict_case_insensitive()
    {
        var client = factory.CreateClient();
        var name = "Dup_" + Guid.NewGuid().ToString("N")[..8];

        var first = await client.PostAsJsonAsync("/api/auth/register", new { username = name, password = "password123" });
        Assert.Equal(HttpStatusCode.Created, first.StatusCode);

        // Same name, different case → still a conflict (uniqueness is on the normalized username).
        var second = await client.PostAsJsonAsync("/api/auth/register", new { username = name.ToLowerInvariant(), password = "password123" });
        Assert.Equal(HttpStatusCode.Conflict, second.StatusCode);
    }

    [Fact]
    public async Task Register_short_password_is_bad_request()
    {
        var client = factory.CreateClient();
        var res = await client.PostAsJsonAsync("/api/auth/register",
            new { username = "shorty_" + Guid.NewGuid().ToString("N")[..6], password = "x" });
        Assert.Equal(HttpStatusCode.BadRequest, res.StatusCode);
    }

    [Fact]
    public async Task Login_succeeds_then_wrong_password_is_unauthorized()
    {
        var client = factory.CreateClient();
        var name = "log_" + Guid.NewGuid().ToString("N")[..8];
        await client.RegisterAsync(name);

        var ok = await client.PostAsJsonAsync("/api/auth/login", new { username = name, password = "password123" });
        Assert.Equal(HttpStatusCode.OK, ok.StatusCode);

        var bad = await client.PostAsJsonAsync("/api/auth/login", new { username = name, password = "wrong-password" });
        Assert.Equal(HttpStatusCode.Unauthorized, bad.StatusCode);
    }

    [Fact]
    public async Task Login_unknown_user_is_unauthorized()
    {
        var client = factory.CreateClient();
        var res = await client.PostAsJsonAsync("/api/auth/login",
            new { username = "nobody_" + Guid.NewGuid().ToString("N")[..8], password = "password123" });
        Assert.Equal(HttpStatusCode.Unauthorized, res.StatusCode);
    }

    [Fact]
    public async Task Me_requires_auth_and_returns_username()
    {
        var client = factory.CreateClient();
        var anon = await client.GetAsync("/api/auth/me");
        Assert.Equal(HttpStatusCode.Unauthorized, anon.StatusCode);

        var auth = await client.RegisterAsync();
        client.Authorize(auth.Token);
        var me = await client.GetFromJsonAsync<MeResp>("/api/auth/me");
        Assert.Equal(auth.Username, me!.Username);
    }

    [Fact]
    public async Task Me_with_malformed_token_is_unauthorized()
    {
        var client = factory.CreateClient();
        // Not even a JWT — must be rejected.
        client.Authorize("not-a-real-jwt-token");
        var res = await client.GetAsync("/api/auth/me");
        Assert.Equal(HttpStatusCode.Unauthorized, res.StatusCode);
    }

    [Fact]
    public async Task Me_with_token_signed_by_wrong_secret_is_unauthorized()
    {
        var client = factory.CreateClient();
        // Valid JWT shape + correct issuer/audience, but signed with a different key → bad signature.
        var forged = TestApi.ForgeJwt(
            signingKey: "a-totally-different-secret-key-not-the-servers-0123456789",
            expires: DateTime.UtcNow.AddMinutes(60));
        client.Authorize(forged);
        var res = await client.GetAsync("/api/auth/me");
        Assert.Equal(HttpStatusCode.Unauthorized, res.StatusCode);
    }

    [Fact]
    public async Task Me_with_expired_token_is_unauthorized()
    {
        var client = factory.CreateClient();
        // Correctly signed with the server's key, but expired well beyond the clock-skew allowance.
        var expired = TestApi.ForgeJwt(
            signingKey: CustomWebApplicationFactory.JwtKey,
            expires: DateTime.UtcNow.AddMinutes(-5));
        client.Authorize(expired);
        var res = await client.GetAsync("/api/auth/me");
        Assert.Equal(HttpStatusCode.Unauthorized, res.StatusCode);
    }
}
