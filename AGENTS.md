# Project Instructions

## General

Treat the existing codebase as the primary source of truth for style, naming, structure, and architecture.

New code should look like it was naturally written by the existing author of this repository.

Before modifying code:

- inspect nearby files that solve similar problems
- follow existing naming and structure
- reuse existing helpers and patterns
- avoid introducing new architectural patterns unless required for correctness

Prefer the smallest coherent diff.

Do not refactor unrelated working code.

## Backend

Preserve the current NestJS architecture:

controller
→ service
→ Prisma / Storage / existing services

Keep controllers thin.

Business logic belongs in services.

Use the existing:

- DTO + class-validator approach
- AuthGuard
- ownership/access checks
- Prisma patterns
- Nest exceptions

Do not introduce:

- repository layers
- CQRS
- generic base services
- domain entities
- unnecessary interfaces
- additional manager/helper layers

unless the existing architecture genuinely requires them.

Raw SQL should only be used for database behavior Prisma cannot express correctly.

## Frontend

Preserve the current React architecture.

Use the existing:

- React Router
- TanStack Query
- Axios clients
- Auth context
- shadcn/ui
- local component state

Server state belongs in TanStack Query.

Do not introduce:

- Redux
- Zustand
- another request library
- another form library
- unnecessary global contexts

Owner API, public-share API, and user-share API must remain separate security boundaries.

Direct S3 uploads must continue using plain Axios and must never send the application Bearer token.

## Style

Match surrounding code.

Prefer:

- simple functions
- direct naming
- explicit code
- existing import conventions
- existing error-handling patterns

Avoid over-engineering.

Do not create abstractions for one-off logic unless they clearly simplify the implementation.

Comments should explain WHY non-obvious behavior exists, not narrate obvious code.

## Scope control

Do not expand requested work into unrelated features.

Do not add optional features unless explicitly requested.

Do not redesign working architecture merely because another implementation might be theoretically cleaner.

## Verification

After backend changes, run:

- npm test
- npm run lint
- npm run build

After frontend changes, run:

- npm run lint
- npm run build

Run `git diff --check` after changes.

Do not finish with newly introduced lint, test, build, or formatting failures.

## Decision priority

When multiple implementations are valid, prefer:

1. correctness and security
2. consistency with existing architecture
3. consistency with existing author style
4. simplicity
5. UX
6. theoretical architectural elegance
