# General

## Conventions

- **Stay backend-agnostic.** No references to .NET / ASP.NET / EF in code or comments —
  the SPA only knows the relative HTTP contract via `src/api/client.ts`. Write
  `// mirror the API responses`, not `// mirror the .NET DTOs`.
- **No defensive leading semicolons** (`;(async () => {…})()`). Define a named function
  and call it: `const load = async () => {…}; load()`.

## Testing guidelines
* Do not rely on copy text (displayed text that could change) for test validation.
* Use MSW for network calls.