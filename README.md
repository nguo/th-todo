# Todo

A proof-of-concept production MVP web app: register/log in, then manage a personal todo list.

- **Backend:** ASP.NET Core Web API (.NET 10, Controllers) + EF Core + SQLite, JWT bearer auth
- **Frontend:** React + TypeScript (Vite), client-side routing
- **Architecture:** two independent services behind a single origin. A reverse proxy
  routes `/api/*` → the .NET API and everything else → the React SPA. Because the browser
  only ever sees one origin, **there is no CORS**. In dev the Vite dev server plays the
  proxy role; in prod use HAProxy / an ingress / ALB / nginx.

```
todo-ezra/
├── backend/                      # .NET service
│   ├── Todo.slnx
│   ├── Todo.Api/
│   │   ├── Program.cs            # DI + middleware wiring (auth, EF, HTTP logging, forwarded headers)
│   │   ├── Auth/                 # JWT options + token issuance
│   │   ├── Controllers/          # Health, Auth, Lists, Todos endpoints
│   │   ├── Models/               # EF entities: User, TodoList, TodoItem
│   │   ├── Dtos/                 # request/response shapes
│   │   ├── Data/AppDbContext.cs  # EF Core DbContext + all model mapping
│   │   ├── Logging/              # HTTP-logging interceptor (redacts auth bodies)
│   │   └── Migrations/           # EF Core migrations
│   └── Todo.Api.Tests/           # xUnit integration + unit tests
└── frontend/                     # Vite React TS SPA
    ├── vite.config.ts            # dev proxy: /api → http://localhost:5080
    └── src/
        ├── api/client.ts         # typed fetch wrapper hitting relative /api
        ├── auth/                 # AuthProvider, auth context, ProtectedRoute
        ├── components/           # AddTodo, TodoItemRow, Navbar, AuthForm, …
        ├── layout/               # AppLayout (authed) + GuestLayout (logged-out)
        ├── pages/                # Login, Register, Todo
        └── App.tsx               # route table
```

## Prerequisites

- **.NET 10 SDK** — `brew install --cask dotnet-sdk`
  (Homebrew installs to `/usr/local/share/dotnet`; ensure that's on your `PATH`.)
- **EF Core CLI** — `dotnet tool install --global dotnet-ef`
  (installs to `~/.dotnet/tools`; ensure that's on your `PATH`.)
- **Node** (v20+; tested on v24) + npm.

## Run it (two terminals)

**First time only** — set the JWT signing key. The API refuses to start without it. In dev
it's stored in user-secrets (never committed); in prod supply it via the `Jwt__Key` env var.

```bash
dotnet user-secrets set "Jwt:Key" "$(openssl rand -base64 48)" --project backend/Todo.Api
```

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

Open http://localhost:5173 — register an account, and you'll land on your todo list.

## Verify the stack

```bash
curl http://localhost:5080/api/health        # direct to API
curl http://localhost:5173/api/health        # through the Vite proxy
# → {"status":"ok","database":"connected"}
```

OpenAPI doc (dev only, no UI): http://localhost:5080/openapi/v1.json

## Tests

**Backend** — xUnit. Integration tests boot the real app against in-memory SQLite and inject
their own JWT config, so no user-secrets setup is needed.

```bash
dotnet test backend/Todo.slnx
```

**Frontend** — Vitest + Testing Library, with MSW stubbing the API at the fetch layer.

```bash
cd frontend
npm run test
```

## Database

- SQLite file `backend/Todo.Api/todo.db` (gitignored). Schema: `Users`, `TodoLists`,
  `TodoItems`, all keyed by UUIDv7. Each new account gets a default "My Tasks" list.
- On startup `db.Database.Migrate()` applies any pending EF migrations, so the file is
  created and brought up to date automatically on first run.
  (At horizontal scale this moves to a gated deploy step so instances don't race.)
- **To change the schema:** edit the entity and its mapping in `OnModelCreating`, then
  `dotnet ef migrations add <Name> --project backend/Todo.Api`. The new migration applies on
  the next launch.

## Production notes

- Build the SPA with `npm run build` (outputs static files to `frontend/dist/`); serve
  those from any static host/CDN or behind the same proxy.
- Configure the reverse proxy to forward `/api/*` to the API **with the path preserved**
  (keep the `/api` prefix on the .NET routes) so dev and prod behave identically.
- The API trusts `X-Forwarded-*` headers (`UseForwardedHeaders`) for correct
  scheme/host behind the proxy.
- Supply `Jwt__Key` (and any non-default `Jwt__Issuer`/`Jwt__Audience`) from a secret
  manager / env vars. The DB swaps to Postgres by changing the `ConnectionStrings:Default`
  connection string and the EF provider package — no SQL in the app is provider-specific.
```
