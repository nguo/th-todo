# Todo app

Stack, architecture, and all run/build/test/migration commands are in the README —
don't restate them here. Conventions are scoped: backend/ and frontend/ have their own
CLAUDE.md that load when working in those subtrees.

@README.md

## Conventions (cross-cutting)

- **Keep the DB provider swappable.** All EF mapping in `OnModelCreating`; no
  SQLite-specific SQL. SQLite (dev) → Postgres (prod) is a config swap.
- For trivial/minimal edits (a one-line tweak, removing a CSS class), skip the
  lint/build/test verify step unless asked — reserve it for substantive changes.
