# Database

RISKOS persists all data (users, profiles, assessments, audit events, model
config versions) to Postgres via `lib/db/store.ts`, using the `pg` driver
directly (no ORM). The schema is created automatically on first request —
see `lib/db/init.ts` (`lib/db/schema.sql` is a human-readable reference copy
of the same DDL).

## Configuration

Set `POSTGRES_URL` (or `DATABASE_URL`) to a Postgres connection string. See
`.env.local.example`. Vercel Postgres / Neon integrations set `POSTGRES_URL`
automatically when linked to your project.

## Local development

Either:

- Run Postgres in Docker:
  `docker run -e POSTGRES_PASSWORD=postgres -p 5432:5432 -d postgres`
  then set `POSTGRES_URL=postgres://postgres:postgres@localhost:5432/postgres`
  in `.env.local`.
- Or create a free project at https://neon.tech and copy its connection
  string into `.env.local` as `POSTGRES_URL` (Neon requires SSL, which
  `lib/db/pg.ts` enables automatically for non-localhost hosts).

No manual migration step is needed — tables are created idempotently on
first DB access.
