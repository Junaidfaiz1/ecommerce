# Tech Stack — VORQEN

## Version policy

**Always prefer the latest stable versions** of every dependency and tool.

| Rule | Detail |
|------|--------|
| New packages | Install latest stable (`pnpm add <pkg>@latest`) |
| Related packages | Keep majors aligned (`next` ↔ `eslint-config-next`, `prisma` ↔ `@prisma/client`) |
| Upgrades | Use `pnpm deps:latest` / `pnpm up -r --latest`, then typecheck + lint |
| Pins | Only when upstream requires it — document below |

Cursor rule: `.cursor/rules/latest-versions.mdc`

### Current baseline (as of 2026-08-24)

| Package | Version target |
|---------|----------------|
| Next.js | **16.3.2** |
| React / React DOM | **19.2.8** |
| Prisma / `@prisma/client` | **7.9.1** |
| GraphQL | **17.0.2** |
| GraphQL Yoga | **5.22.0** |
| Tailwind CSS | **4.3.3** |
| Turborepo | **2.10.11** |
| TypeScript | **5.9.3** (see pin) |
| jose | **6.2.10** |
| bcryptjs | **3.0.3** |
| Zod | **4.4.3** |
| Three.js | **0.185.1** |
| @react-three/fiber | **9.7.0** |
| @react-three/drei | **10.7.8** |
| Stripe | **22.6.0** |
| @stripe/stripe-js | **9.15.0** |
| @stripe/react-stripe-js | **6.8.2** |
| Resend | **6.25.0** |
| Recharts | **3.10.1** |

### Version pins

| Package | Pin | Reason |
|---------|-----|--------|
| `typescript` | `~5.9.3` | Prisma 7 recommends TypeScript **5.9.x** (min 5.4). |
| `eslint` | `~9.39.5` | `eslint-config-next@16` peers require ESLint 9 (not 10 yet). |

## Package manager & monorepo

| Tool | Role |
|------|------|
| **pnpm** | Package manager |
| **Turborepo** | Task orchestration |
| **GitHub Actions** | CI |
| **Vercel** | Host Next.js (UI + API routes) |
| **Neon (or similar)** | PostgreSQL (dev + prod) — **no Docker** |

## Application (`apps/web` only)

| Library | Role |
|---------|------|
| Next.js 16+ (App Router) | UI + Route Handlers + RSC |
| TypeScript 5.9 | Strict typing |
| Tailwind CSS 4 + shadcn/ui | Styling / primitives |
| GraphQL Yoga | GraphQL at `/api/graphql` |
| Apollo Client | Browser GraphQL client (later phases) |
| Prisma 7 + `@prisma/adapter-pg` | ORM |
| jose | JWT access + refresh |
| bcryptjs | Password hashing |
| PostgreSQL | Database |
| Zod | Validation |
| React Hook Form | Forms |
| Zustand | Client UI state |
| R3F + Three.js + drei | 3D |
| Framer Motion | Motion |
| Recharts | Admin charts |
| Lucide React | Icons |

## Shared packages

| Package | Role |
|---------|------|
| `packages/ui` | Shared components |
| `packages/types` | Shared types |
| `packages/config` | TSConfig presets |

## External services

| Service | Purpose |
|---------|---------|
| Stripe | Payments + PaymentIntents + webhooks |
| Cloudflare R2 | Media + 3D assets |
| Resend | Transactional email (verify, reset, order paid, abandoned cart) |
| Sentry | Monitoring |

## Forbidden stack

- NestJS / standalone Express API app
- Docker / Docker Compose / containers
- Redis, BullMQ, RabbitMQ, Kafka
- Unnecessary microservices

Scheduled work: **PostgreSQL + Next.js cron Route Handlers** (Vercel Cron / external cron + `CRON_SECRET`).

## Environment variables

```
DATABASE_URL=
JWT_SECRET=
JWT_REFRESH_SECRET=
CRON_SECRET=
STRIPE_SECRET_KEY=
STRIPE_WEBHOOK_SECRET=
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=
R2_ACCOUNT_ID=
R2_ACCESS_KEY_ID=
R2_SECRET_ACCESS_KEY=
R2_BUCKET_NAME=
R2_PUBLIC_URL=
RESEND_API_KEY=
RESEND_FROM_EMAIL=
SENTRY_DSN=
NEXT_PUBLIC_APP_URL=http://localhost:3000
NEXT_PUBLIC_GRAPHQL_URL=http://localhost:3000/api/graphql
```
