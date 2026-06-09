# Todoer

A basic Todo web app

- **Backend:** ASP.NET Core Web API (.NET 10, Controllers) + EF Core + SQLite, JWT bearer auth
- **Frontend:** React + TypeScript (Vite), client-side routing


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

## How to Run (two processes)

**First time only** — set the JWT signing key. The API refuses to start without it. In dev
it's stored in user-secrets (never committed).

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

**Open** http://localhost:5173

Register for an account, and you'll get sent to your todo list

## Verify the stack

```bash
curl http://localhost:5080/api/health        # direct to API
curl http://localhost:5173/api/health        # through the Vite proxy
# → {"status":"ok","database":"connected"}
```

OpenAPI JSON doc: http://localhost:5080/openapi/v1.json

## Tests

**Backend** — xUnit. Integration tests boot the real app against in-memory SQLite and inject
their own JWT config.

```bash
dotnet test backend/Todo.slnx
```

**Frontend** — Vitest + Testing Library, with MSW stubbing the API at the fetch layer.

```bash
cd frontend
npm run test
```

## Database

- SQLite file `backend/Todo.Api/todo.db` (gitignored).
- Schema and Relations:
  ```
  Users      1:N  TodoLists
  TodoLists  1:N  TodoItems
  ```
- All tables keyed by UUIDv7 IDs.
- Each new account gets a default "My Tasks" list.
- On startup `db.Database.Migrate()` applies any pending EF migrations, so the file is
  created and brought up to date automatically on first run.
- Foreign keys are indexed for faster lookup.

## Production notes

- Build the SPA frontend with `npm run build` (outputs static files to `frontend/dist/`); serve
  those from any static host/CDN or behind the same proxy.
- Configure the reverse proxy to forward `/api/*` to the API with the path preserved
  (keep the `/api` prefix on the .NET routes) so dev and prod behave identically.
- Supply `Jwt__Key` (and any non-default `Jwt__Issuer`/`Jwt__Audience`) from a secret
  manager / env vars.
- Supply `ConnectionStrings__Default` for Database connection strings.
- Update `"AllowedHosts": "*"` in `appsettings.json` to use final hostname

# 📝 Design
## Design Choices
- Single origin, no CORS. A reverse proxy routes `/api/* ` to the .NET API. This allows us to use the same domain for different services.
- `backend/` and `frontend/` split into two directories. Keeps them independent. Can easily swap the React app to use a different backend.
- JWT auth - this gives us stateless session with no server-side needs. For MVP, we use the `localStorage` and `Authorization: Bearer` 
approach with a 60min timer and no refresh logic. This simplifies the design so we don't need to handle cookies, but opens us up to 
XSS attacks (via `localStorage`) and stolen tokens.
- Database IDs are UUIDv7 instead of incremented counters. This removes the need to coordinate counters.
- The database and REST APIs reference an intermediary `TodoList` that is currently unused. This is for future-proofing when we want to allow 
the user to create multiple lists. Adding it after-the-matter would require a medium-weight refactoring since it changes the shape of the data and API endpoints. 
The tradeoff here is we're adding an extra lookup hop from list -> todo items for now while it's not being used.
- Database can be easily swapped from SQLite to Postgres or something more production-friendly via config.
- Added logging of requests and basic headers for debugging purposes.
- A user can create multiple todo items of the same title, ie. it is not idempotent.
- User password hash stored directly on the User table for simplicity, but it could potentially live in an UserAuth 
table that includes other forms of login.
- Use the `data-testid` custom data attribute to select DOM elements in our frontend tests. Keeps element-selection stable and 
independent of copy or element type / structure.

## Scalability (horizontal)
- JWT auth scales well due to being stateless.
- UUIDv7 IDs means no need for extra coordination.
- Database is a bottleneck. See [Future Work > Platform](#platform) for more.
- No caching layer, so the database will get hit for every request. See [Future Work > Platform](#platform) for more.

## Actual Production MVP
- Enforce HTTPS.
- Hook up email so users can go through password recovery flows. Dovetails into change password flow.
- Error monitoring / observability / alerting. Traceid already set up for OpenTelemetry.
- Add JWT refresh flow - currently they expire in 60min and the user gets logged out.

## Future Work
### Features
- Drag and drop (reordering) of todo items
- Due dates (+ notifications further down the road)
- Multiple lists of todo items.
- User settings: profile image, username / email / password updates
- User collaboration: sharing lists, assigning users, collaborating
- Analytics

### Platform
- Add rate limiting, especially for auth routes.
- Add more read replicas to scale the database. The pairs well with the read-heavy app. If more primaries are needed, 
we can partition by user for faster queries, but would introduce potential imbalanced shards based on user usage.
- Remove database migrations on startup. Instead, run migrations separately before releasing a new schema change to avoid race conditions.
- Add caching layer, eg. store frequently-accessed data in Redis.
- Change JWT auth to use httpOnly cookie with SameSite=Strict to move away from `localStorage` and XSS attacks.
- Add mechanism for auto-rotating secrets used for the JWT signing and support multiple secrets (on rotation basis).
- Change port and API path prefix to be defined in config instead of hardcoded.
- Introduce short slugs for lists so the web URL on a specific list doesn't display the UUID ID.