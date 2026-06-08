using System.Text;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.AspNetCore.HttpOverrides;
using Microsoft.AspNetCore.Identity;
using Microsoft.EntityFrameworkCore;
using Microsoft.IdentityModel.Tokens;
using Todo.Api.Auth;
using Todo.Api.Data;
using Todo.Api.Models;

var builder = WebApplication.CreateBuilder(args);

// --- Services (DI container) ---

// EF Core + SQLite. The connection string lives in appsettings.json. Mapping is provider
// agnostic, so swapping to Postgres later is a package + connection-string change.
builder.Services.AddDbContext<AppDbContext>(options =>
    options.UseSqlite(builder.Configuration.GetConnectionString("Default")));

// Auth: bind JWT settings, hash passwords with the built-in PBKDF2 hasher, issue tokens.
builder.Services.Configure<JwtOptions>(builder.Configuration.GetSection("Jwt"));
builder.Services.AddSingleton<IPasswordHasher<User>, PasswordHasher<User>>();
builder.Services.AddSingleton<TokenService>();

var jwt = builder.Configuration.GetSection("Jwt").Get<JwtOptions>()
          ?? throw new InvalidOperationException("Missing 'Jwt' configuration section.");
if (string.IsNullOrWhiteSpace(jwt.Key))
{
    // Dev: `dotnet user-secrets set "Jwt:Key" <value>`. Prod: Jwt__Key env var / secret manager.
    throw new InvalidOperationException(
        "Jwt:Key is not configured. Set it via user-secrets (dev) or the Jwt__Key env var (prod).");
}

builder.Services.AddAuthentication(JwtBearerDefaults.AuthenticationScheme)
    .AddJwtBearer(options =>
    {
        options.TokenValidationParameters = new TokenValidationParameters
        {
            ValidateIssuer = true,
            ValidIssuer = jwt.Issuer,
            ValidateAudience = true,
            ValidAudience = jwt.Audience,
            ValidateIssuerSigningKey = true,
            IssuerSigningKey = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(jwt.Key)),
            ValidateLifetime = true,
            ClockSkew = TimeSpan.FromSeconds(30),
        };
    });
builder.Services.AddAuthorization();

builder.Services.AddControllers();

// Emits the OpenAPI JSON doc (no UI). Handy later for generating a typed TS client.
builder.Services.AddOpenApi();

var app = builder.Build();

// Apply EF Core migrations on startup so the schema is created/upgraded automatically.
// (At horizontal scale this moves to a gated deploy step to avoid N instances racing.)
using (var scope = app.Services.CreateScope())
{
    var db = scope.ServiceProvider.GetRequiredService<AppDbContext>();
    db.Database.Migrate();
}

// --- Middleware pipeline ---

// The API runs behind a reverse proxy (Vite in dev, HAProxy/ingress in prod).
// Honor X-Forwarded-* so the app sees the original scheme/host.
app.UseForwardedHeaders(new ForwardedHeadersOptions
{
    ForwardedHeaders = ForwardedHeaders.XForwardedFor | ForwardedHeaders.XForwardedProto,
});

if (app.Environment.IsDevelopment())
{
    app.MapOpenApi();
}

// No CORS: the browser only ever sees one origin (the proxy fans out by path),
// so cross-origin rules never come into play.

app.UseAuthentication();
app.UseAuthorization();

app.MapControllers();

app.Run();

// Exposes the implicit Program type to the test project for WebApplicationFactory<Program>.
// No runtime effect.
public partial class Program { }
