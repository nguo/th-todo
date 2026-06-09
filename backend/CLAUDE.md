# Backend (ASP.NET Core + EF Core)

- **UUIDv7 PKs** (`Guid.CreateVersion7()`) on all entities — coordination-free,
  time-ordered, no enumeration leakage.
- **Stateless auth:** JWT bearer; any instance validates with the shared signing key,
  no server-side sessions.
- Todo routes nest under `/api/lists/{listId}/todos` (keeps future multi-list
  non-breaking).
- EF mapping lives in `OnModelCreating`; keep it provider-agnostic (see root CLAUDE.md).
