# VORQEN

**Build Beyond Limits.**

Premium gaming hardware marketplace with PC Builder, compatibility engine, performance estimates, and interactive 3D.

## Status

**Phase 18 complete** — 3D budgets, catalog query pass, `next/image`. Next: Phase 19 (Deployment). See [`PROGRESS.md`](./PROGRESS.md).

## Monorepo layout

```
apps/web         Next.js App Router (UI + GraphQL/API + server domains)
packages/ui      Shared React primitives
packages/types   Shared TypeScript types
packages/config  Shared TSConfig
prisma/          Full commerce + hardware schema, migrations, seed
docs/            Architecture and phase docs
```

**No NestJS. No `apps/api`.** Backend logic lives in `apps/web/src/server`.

## Prerequisites

- Node.js 20.19+
- pnpm 10+
- PostgreSQL via **Neon** (recommended) or a native local Postgres install — **no Docker**

## Setup

```bash
pnpm install
cp .env.example .env
# Set DATABASE_URL to your Neon (or local) Postgres connection string
pnpm db:generate
pnpm exec prisma migrate deploy   # or: pnpm db:push
pnpm db:seed
```

## Development

```bash
pnpm dev
# http://localhost:3000
# GraphQL: http://localhost:3000/api/graphql
# Health:  http://localhost:3000/api/health
```

## Quality

```bash
pnpm typecheck
pnpm lint
pnpm test
pnpm test:e2e
pnpm format
```

`pnpm test` is unit + in-memory integration (no Postgres required).  
`pnpm test:e2e` re-runs the builder→paid path; set `E2E_BASE_URL` (running `pnpm dev`) to also hit HTTP routes.

## Environment

Keep a single `.env` at the **repo root** (see [`.env.example`](./.env.example) and [`docs/tech-stack.md`](./docs/tech-stack.md)). Next.js loads it via `loadRootEnv()` — do not duplicate secrets under `apps/web`.

## Documentation

| File | Purpose |
|------|---------|
| [AGENTS.md](./AGENTS.md) | AI agent entry |
| [PROGRESS.md](./PROGRESS.md) | Current phase / next |
| [docs/](./docs/) | Architecture, features, UI, validation, … |
| [.cursor/rules/](./.cursor/rules/) | Cursor rules |

## Stack

pnpm · Turborepo · **Next.js only** · Prisma · PostgreSQL · GraphQL Yoga · Stripe · R2 · Resend
