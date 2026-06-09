using System.Collections.Concurrent;
using System.IdentityModel.Tokens.Jwt;
using System.Net.Http.Json;
using System.Security.Claims;
using Microsoft.AspNetCore.Hosting;
using Microsoft.AspNetCore.HttpLogging;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Logging;
using Microsoft.Extensions.Options;

namespace Todo.Api.Tests;

// Proves the HTTP-logging guard: even with request/response *body* logging turned on (the
// "dangerous" config someone might enable to debug), /api/auth bodies never reach the logs,
// while non-auth bodies do — and entries carry the user/traceId correlators.
public class HttpLoggingRedactionTests(CustomWebApplicationFactory factory)
    : IClassFixture<CustomWebApplicationFactory>
{
    // A fresh client whose host enables body logging and captures every log message.
    private (HttpClient client, ConcurrentBag<string> logs) CreateWithCapture()
    {
        var provider = new CapturingLoggerProvider();
        var client = factory.WithWebHostBuilder(b =>
        {
            b.ConfigureServices(s => s.Configure<HttpLoggingOptions>(o =>
            {
                // Turn bodies ON — the interceptor must still keep /api/auth bodies out.
                o.LoggingFields |= HttpLoggingFields.RequestBody | HttpLoggingFields.ResponseBody;
                o.MediaTypeOptions.AddText("application/json");
            }));
            b.ConfigureLogging(lb =>
            {
                lb.AddProvider(provider);
                lb.AddFilter("Microsoft.AspNetCore.HttpLogging.HttpLoggingMiddleware", LogLevel.Information);
            });
        }).CreateClient();
        return (client, provider.Messages);
    }

    [Fact]
    public async Task Login_request_body_is_never_logged()
    {
        const string password = "SuperSecret-Canary-7f3a";
        var (client, logs) = CreateWithCapture();
        var name = (await client.RegisterAsync(password: password)).Username;

        var res = await client.PostAsJsonAsync("/api/auth/login", new { username = name, password });
        res.EnsureSuccessStatusCode();

        // The request was logged at all (otherwise the assertion below is vacuous)...
        Assert.Contains(logs, m => m.Contains("/api/auth/login"));
        // ...but the password never appears in any entry.
        Assert.DoesNotContain(logs, m => m.Contains(password));
    }

    [Fact]
    public async Task Non_auth_body_is_logged_with_user_and_trace_correlators()
    {
        const string title = "todo-title-canary-91c2";
        var (client, logs) = CreateWithCapture();

        var reg = await client.RegisterAsync();
        client.Authorize(reg.Token);
        var listId = await client.DefaultListIdAsync();
        var uid = new JwtSecurityTokenHandler().ReadJwtToken(reg.Token).Claims
            .First(c => c.Type is "nameid" or ClaimTypes.NameIdentifier).Value;

        var res = await client.PostAsJsonAsync($"/api/lists/{listId}/todos", new { title });
        res.EnsureSuccessStatusCode();

        // Body logging is genuinely on (proves the login test isn't passing because logging is dead).
        Assert.Contains(logs, m => m.Contains(title));
        // The authenticated request carries both correlators.
        Assert.Contains(logs, m => m.Contains(uid) && m.Contains("traceId"));
    }

    private sealed class CapturingLoggerProvider : ILoggerProvider
    {
        public ConcurrentBag<string> Messages { get; } = new();
        public ILogger CreateLogger(string categoryName) => new CapturingLogger(Messages);
        public void Dispose() { }

        private sealed class CapturingLogger(ConcurrentBag<string> sink) : ILogger
        {
            public IDisposable? BeginScope<TState>(TState state) where TState : notnull => null;
            public bool IsEnabled(LogLevel logLevel) => true;
            public void Log<TState>(LogLevel logLevel, EventId eventId, TState state,
                Exception? exception, Func<TState, Exception?, string> formatter)
                => sink.Add(formatter(state, exception));
        }
    }
}
