using Microsoft.AspNetCore.HttpOverrides;
using Microsoft.EntityFrameworkCore;
using Todo.Api.Data;

var builder = WebApplication.CreateBuilder(args);

// --- Services (DI container) ---

// EF Core + SQLite. The connection string lives in appsettings.json.
builder.Services.AddDbContext<AppDbContext>(options =>
    options.UseSqlite(builder.Configuration.GetConnectionString("Default")));

builder.Services.AddControllers();

// Emits the OpenAPI JSON doc (no UI). Handy later for generating a typed TS client.
builder.Services.AddOpenApi();

var app = builder.Build();

// Ensure the SQLite database file exists so the app has a database to talk to.
// There are no migrations yet (no domain models defined), so this just creates an
// empty file by opening a connection — migration-safe: once the first EF entity and
// migration exist, swap this for `db.Database.Migrate()` to create/upgrade tables.
using (var scope = app.Services.CreateScope())
{
    var db = scope.ServiceProvider.GetRequiredService<AppDbContext>();
    db.Database.OpenConnection();
    db.Database.CloseConnection();
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

app.MapControllers();

app.Run();
