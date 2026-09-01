# Architecture — VORQEN

## Overview

VORQEN is a **Next.js modular monolith**: one Next.js app owns the UI, GraphQL API, webhooks, and cron endpoints. Shared packages + a single PostgreSQL database.

**No NestJS. No separate API app. No Docker. No Redis / message brokers / microservices.**

## Monorepo layout

```
VORQEN/
├── apps/
│   └── web/                 # Next.js 16+ App Router — UI + server
├── packages/
│   ├── ui/
│   ├── types/
│   └── config/
├── prisma/
├── docs/
├── .cursor/rules/
├── prisma.config.ts
├── turbo.json
├── pnpm-workspace.yaml
├── package.json
├── AGENTS.md
└── PROGRESS.md
```

PostgreSQL is provided by **Neon** (or a native local install). **Do not use Docker.**

## System diagram

```
┌──────────────────────────────────────────┐
│                 apps/web                 │
│  Next.js App Router                      │
│  ┌─────────────┐    ┌──────────────────┐ │
│  │ UI (RSC/CC) │    │ /api/graphql     │ │
│  │ features/*  │───►│ /api/webhooks/*  │ │
│  │             │    │ /api/cron/*      │ │
│  └─────────────┘    └────────┬─────────┘ │
│                              │           │
│                     src/server/* services│
└──────────────────────────────┬───────────┘
                               │ Prisma
                               ▼
                        PostgreSQL
                               │
         ┌───────────┬─────────┼─────────┐
         ▼           ▼         ▼         ▼
      Stripe    Cloudflare R2 Resend   Sentry
```

## Frontend

| Group | Purpose |
|-------|---------|
| `(store)` | Shop, builder, compare, performance, showroom |
| `(account)` | Customer dashboard (profile, **orders**, addresses, builds) |
| `(auth)` | Login, register, verify, reset |
| `admin/` | Ops dashboard (dense, not storefront) |

Features: `src/features/<domain>/`. Zustand = UI-only.

## Server domains

Under `apps/web/src/server/`:

`auth`, `users`, `catalog`, `hardware`, `builder`, `compatibility`, `performance`, `benchmark`, `cart`, `wishlist`, `checkout`, `orders`, `payments`, `inventory`, `reviews`, `coupons`, `bundles`, `analytics`, `abandoned-cart`, `email`, `storage`, `three-d-assets`, `notifications`, `audit`, `security`, `seo`, `common`

- Thin GraphQL resolvers / route handlers → **services**
- `CompatibilityEngine` is the only compatibility authority
- Pricing, coupons, inventory = server-authoritative

## API surface

| Path | Role |
|------|------|
| `/api/graphql` | GraphQL (Yoga) |
| `/api/webhooks/stripe` | Stripe webhooks |
| `/api/cron/abandoned-cart` | Abandoned-cart recovery (`CRON_SECRET`) |
| `/api/email/abandoned/[id]` | Recovery email click → `/cart` |
| `/sitemap.xml` | ACTIVE catalog + public routes |
| `/robots.txt` | Disallow admin/account/checkout/api |

## Related

- [`tech-stack.md`](./tech-stack.md)
- [`phases.md`](./phases.md)
- [`api.md`](./api.md)
