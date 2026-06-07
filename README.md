# Todo

A proof-of-concept production MVP web app.

- **Backend:** ASP.NET Core Web API (.NET 10, Controllers) + EF Core + SQLite
- **Frontend:** React + TypeScript (Vite)
- **Architecture:** two independent services behind a single origin. A reverse proxy
  routes `/api/*` → the .NET API and everything else → the React SPA. Because the browser
  only ever sees one origin, **there is no CORS**. In dev the Vite dev server plays the
  proxy role; in prod use HAProxy / an ingress / ALB / nginx.

```
todo-ezra/
├── backend/                  # .NET service
│   ├── Todo.slnx
│   └── Todo.Api/
│       ├── Program.cs        # DI + middleware wiring (DbContext, OpenAPI, forwarded headers)
│       ├── Controllers/      # HTTP endpoints (HealthController for now)
│       ├── Models/           # EF entity classes (added as the domain is defined)
│       └── Data/AppDbContext.cs  # EF Core DbContext → SQLite
└── frontend/                 # Vite React TS SPA
    ├── vite.config.ts        # dev proxy: /api → http://localhost:5080
    └── src/
        ├── api/client.ts     # typed fetch wrapper hitting relative /api
        └── App.tsx           # calls /api/health as a stack check
```

## Prerequisites

- **.NET 10 SDK** — `brew install --cask dotnet-sdk`
  (Homebrew installs to `/usr/local/share/dotnet`; ensure that's on your `PATH`.)
- **EF Core CLI** — `dotnet tool install --global dotnet-ef`
  (installs to `~/.dotnet/tools`; ensure that's on your `PATH`.)
- **Node** (v20+; tested on v24) + npm.

## Run it (two terminals)

**Backend** (http://localhost:5080):

```bash
dotnet run --project backend/Todo.Api --launch-profile http
```

**Frontend** (http://localhost:5173):

```bash
cd frontend
npm install     # first time only
npm run dev
```

Open http://localhost:5173 — the page shows the API status and database connectivity,
fetched from the .NET API through the Vite proxy.

## Verify the stack

```bash
curl http://localhost:5080/api/health        # direct to API
curl http://localhost:5173/api/health        # through the Vite proxy
# → {"status":"ok","database":"connected"}
```

OpenAPI doc (dev only, no UI): http://localhost:5080/openapi/v1.json

## Database

- SQLite file `backend/Todo.Api/todo.db`, created automatically on first run
  (gitignored). The `DbContext` has no entities yet — the schema starts when the first
  domain model is added.
- **When the first EF entity is added:**
  1. Add the entity class under `Models/` and a `DbSet<>` to `AppDbContext`.
  2. `dotnet ef migrations add InitialCreate --project backend/Todo.Api`
  3. In `Program.cs`, replace the startup "open connection" block with
     `db.Database.Migrate();` so schema is created/upgraded on launch.

## Production notes

- Build the SPA with `npm run build` (outputs static files to `frontend/dist/`); serve
  those from any static host/CDN or behind the same proxy.
- Configure the reverse proxy to forward `/api/*` to the API **with the path preserved**
  (keep the `/api` prefix on the .NET routes) so dev and prod behave identically.
- The API trusts `X-Forwarded-*` headers (`UseForwardedHeaders`) for correct
  scheme/host behind the proxy.
