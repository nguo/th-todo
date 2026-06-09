using System.Text;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.AspNetCore.HttpLogging;
using Microsoft.AspNetCore.HttpOverrides;
using Microsoft.AspNetCore.Identity;
using Microsoft.EntityFrameworkCore;
using Microsoft.IdentityModel.Tokens;
using Todo.Api.Auth;
using Todo.Api.Data;
using Todo.Api.Logging;
using Todo.Api.Models;

var builder = WebApplication.CreateBuilder(args);

// --- Services (DI container) ---

// EF Core + SQLite (conn string in appsettings). Provider-agnostic mapping — Postgres
// = package + conn-string swap
builder.Services.AddDbContext<AppDbContext>(options =>
    options.UseSqlite(builder.Configuration.GetConnectionString("Default")));

// Auth: JWT settings, built-in PBKDF2 hasher, token service
builder.Services.Configure<JwtOptions>(builder.Configuration.GetSection("Jwt"));
builder.Services.AddSingleton<IPasswordHasher<User>, PasswordHasher<User>>();
builder.Services.AddSingleton<TokenService>();

var jwt = builder.Configuration.GetSection("Jwt").Get<JwtOptions>()
          ?? throw new InvalidOperationException("Missing 'Jwt' configuration section.");
if (string.IsNullOrWhiteSpace(jwt.Key))
{
    // Dev: `dotnet user-secrets set "Jwt:Key" <value>`. Prod: Jwt__Key env var / secret manager
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

// HTTP logging. Safe default: properties + headers + timing, no bodies (headers redacted
// unless allow-listed, so Authorization/Cookie never leak)
builder.Services.AddHttpLogging(o =>
{
    o.LoggingFields = HttpLoggingFields.RequestPropertiesAndHeaders
                    | HttpLoggingFields.ResponsePropertiesAndHeaders
                    | HttpLoggingFields.Duration;
    o.CombineLogs = true; // One entry per request, not several
});
// Defense-in-depth: strips /api/auth/* bodies even if body logging is on; adds user/traceId
builder.Services.AddHttpLoggingInterceptor<AuthBodyLoggingInterceptor>();

// OpenAPI JSON doc, no UI. Handy later for a typed TS client
builder.Services.AddOpenApi();

var app = builder.Build();

// Apply EF migrations on startup (create/upgrade schema). At scale this moves to a gated
// deploy step so instances don't race
using (var scope = app.Services.CreateScope())
{
    var db = scope.ServiceProvider.GetRequiredService<AppDbContext>();
    db.Database.Migrate();
}

// --- Middleware pipeline ---

// Behind a reverse proxy (Vite dev, HAProxy/ingress prod). Honor X-Forwarded-* so the app
// sees the original scheme/host
app.UseForwardedHeaders(new ForwardedHeadersOptions
{
    ForwardedHeaders = ForwardedHeaders.XForwardedFor | ForwardedHeaders.XForwardedProto,
});

// After forwarded headers so logged scheme/host reflect the proxy
app.UseHttpLogging();

if (app.Environment.IsDevelopment())
{
    app.MapOpenApi();
}

// No CORS: browser sees one origin (proxy fans out by path), so cross-origin never applies

app.UseAuthentication();
app.UseAuthorization();

app.MapControllers();

app.Run();

// Exposes the implicit Program type for WebApplicationFactory<Program> in tests. No runtime effect
public partial class Program { }
