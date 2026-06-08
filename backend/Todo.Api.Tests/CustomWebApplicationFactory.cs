using Microsoft.AspNetCore.Hosting;
using Microsoft.AspNetCore.Mvc.Testing;
using Microsoft.Data.Sqlite;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.DependencyInjection.Extensions;
using Todo.Api.Data;

namespace Todo.Api.Tests;

// Boots the real app for integration tests, but swaps the database for an in-memory SQLite one
// and injects deterministic JWT config (so tests don't depend on the dev machine's user-secrets).
// Both overrides apply only to the test host — production wiring is untouched.
public class CustomWebApplicationFactory : WebApplicationFactory<Program>
{
    // The JWT settings the test host validates against. Exposed so tests can forge tokens with the
    // matching issuer/audience (and the right or deliberately-wrong key).
    public const string JwtKey = "integration-test-signing-key-which-is-long-enough-0123456789";
    public const string JwtIssuer = "todo-api-test";
    public const string JwtAudience = "todo-app-test";


    // A single open connection kept alive for the factory's lifetime: an in-memory SQLite DB
    // exists only while a connection to it is open, so sharing one keeps the schema/data across
    // the startup Migrate() and every request.
    private readonly SqliteConnection _connection = new("DataSource=:memory:");

    public CustomWebApplicationFactory()
    {
        // Set via env vars (not ConfigureAppConfiguration) because Program.cs reads the Jwt config
        // at builder time, before the host's ConfigureAppConfiguration callbacks run. Env vars are
        // read at builder time and outrank appsettings/user-secrets, so signing and validation
        // both see these values.
        Environment.SetEnvironmentVariable("Jwt__Key", JwtKey);
        Environment.SetEnvironmentVariable("Jwt__Issuer", JwtIssuer);
        Environment.SetEnvironmentVariable("Jwt__Audience", JwtAudience);
        Environment.SetEnvironmentVariable("Jwt__ExpiryMinutes", "60");

        _connection.Open();
    }

    protected override void ConfigureWebHost(IWebHostBuilder builder)
    {
        builder.ConfigureServices(services =>
        {
            // Replace the file-based SQLite registration with the shared in-memory connection.
            services.RemoveAll<DbContextOptions<AppDbContext>>();
            services.RemoveAll<AppDbContext>();
            services.AddDbContext<AppDbContext>(options => options.UseSqlite(_connection));
        });
    }

    protected override void Dispose(bool disposing)
    {
        base.Dispose(disposing);
        if (disposing) _connection.Dispose();
    }
}
