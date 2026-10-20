# Stratus Status

Taylor and Karl's airline status tracker (stratusstatus.com): plan and track Delta SkyMiles Medallion Qualifying Dollars (MQDs) from flights, card spend, Headstarts, and bonuses.

## Stack

Next.js 16 (App Router, Cache Components) · TypeScript · Tailwind CSS 4 · Neon Postgres + Drizzle ORM · Better Auth · Vitest

## Getting started

```bash
pnpm install
cp .env.example .env.local   # then fill in the values
pnpm db:migrate              # create tables
pnpm db:seed                 # load Delta tiers and cards
pnpm dev                     # http://localhost:3000
```

## Scripts

| Command | What it does |
|---|---|
| `pnpm dev` | Start the dev server |
| `pnpm test` | Run calculation engine tests |
| `pnpm typecheck` / `pnpm lint` | Type and lint checks |
| `pnpm db:generate` | Generate a migration after changing `src/lib/db/schema.ts` |
| `pnpm db:migrate` | Apply migrations to `DATABASE_URL` |
| `pnpm db:seed` | Upsert reference data (programs, tiers, cards) |
| `pnpm db:studio` | Browse the database |

## Layout

- `src/lib/engine/` — pure calculation engine (totals, tiers, chart, earning mix, routes), tested against the original tracker
- `src/lib/db/` — Drizzle schema and client
- `src/lib/tracker/` — server-side data loading, Delta earning methods, validation schemas
- `src/app/dashboard/` — dashboard UI and server actions
- `docs/plan.md` — project plan
