# Features — VORQEN

> Living checklist. Status values: `todo` · `in_progress` · `done` · `blocked`  
> Sync high-level phase status with [`../PROGRESS.md`](../PROGRESS.md).

## Legend

| Status | Meaning |
|--------|---------|
| todo | Not started |
| in_progress | Actively being built |
| done | Complete for current scope |
| blocked | Waiting on dependency |

---

## Platform foundation

| ID | Feature | Phase | Status |
|----|---------|-------|--------|
| F-001 | pnpm + Turborepo monorepo | 1 | done |
| F-002 | Next.js app (`apps/web`) scaffold | 1 | done |
| F-003 | Next.js server domains + GraphQL health stub | 1 | done |
| F-004 | Shared packages (ui, types, config) | 1 | done |
| F-005 | ESLint + Prettier + strict TS | 1 | done |
| F-006 | Prisma foundation + DATABASE_URL (Neon/native Postgres, no Docker) | 1 | done |
| F-007 | `.env.example` + README | 1 | done |
| F-008 | Architecture docs (Next.js-only) | 1 | done |

## Database

| ID | Feature | Phase | Status |
|----|---------|-------|--------|
| F-010 | Full Prisma schema (commerce + hardware) | 2 | done |
| F-011 | Migrations | 2 | done |
| F-012 | Realistic seed data | 2 / 5 | done |

## API foundation

| ID | Feature | Phase | Status |
|----|---------|-------|--------|
| F-020 | GraphQL Yoga foundation in Next.js | 3 | done |
| F-021 | Prisma client module / health check | 1 / 3 | done |
| F-022 | Global validation + error codes | 3 | done |
| F-023 | Query depth / complexity limits | 3 / 16 | done |

## Auth & users

| ID | Feature | Phase | Status |
|----|---------|-------|--------|
| F-030 | Register / login / refresh JWT | 4 | done |
| F-031 | Secure cookies | 4 | done |
| F-032 | Email verification | 4 / 14 | done |
| F-033 | Password reset | 4 / 14 | done |
| F-034 | RBAC (customer / admin / …) | 4 | done |
| F-035 | Addresses | 4 / 8 | done |

## Catalog & hardware

| ID | Feature | Phase | Status |
|----|---------|-------|--------|
| F-040 | Products, variants, images | 5 | done |
| F-041 | Categories, brands | 5 | done |
| F-042 | Typed hardware specs (CPU/GPU/MB/RAM/…) | 5 | done |
| F-043 | Server-side search + filters + sort + pagination | 5 / 8 | done |
| F-044 | Product detail routes (`/gpu/[slug]`, etc.) | 8 | done |
| F-045 | Bundles | 8 / 13 | todo |

## Compatibility & builder

| ID | Feature | Phase | Status |
|----|---------|-------|--------|
| F-050 | CompatibilityEngine service | 6 | done |
| F-051 | Compatibility rules + response shape | 6 | done |
| F-052 | `/build` multi-step builder UI | 7 | done |
| F-053 | Live price / warnings / recommendations | 7 | done |
| F-054 | Save / reopen / duplicate builds | 7 / 18 | done |
| F-055 | Add entire build to cart | 7 / 10 | done |

## Performance estimation

| ID | Feature | Phase | Status |
|----|---------|-------|--------|
| F-060 | Game / benchmark data model | 6 / 7 | done |
| F-061 | FPS estimate by game/resolution/quality | 7 / 8 | done |
| F-062 | Clear “estimated” labeling | 7 | done |

## 3D

| ID | Feature | Phase | Status |
|----|---------|-------|--------|
| F-070 | Homepage hero 3D PC | 9 | done |
| F-071 | Builder 3D PC + component highlight | 9 | done |
| F-072 | Product detail 3D viewer | 9 | done |
| F-073 | Exploded view | 9 | done |
| F-074 | Lazy GLB / Draco loading | 9 / 18 | done |
| F-075 | R2-hosted 3D assets | 9 / 11 | done |

## Commerce

| ID | Feature | Phase | Status |
|----|---------|-------|--------|
| F-080 | Wishlist | 10 | done |
| F-081 | Cart (server price recalc) | 10 | done |
| F-082 | Coupons | 10 / 11 | done |
| F-083 | Checkout steps | 11 | done |
| F-084 | Stripe session + webhook | 11 | done |
| F-085 | Orders + order detail | 12 | done |
| F-086 | Inventory + transactions | 12 | done |
| F-087 | Reviews + review images | 8 / 12 | done |
| F-088 | Product comparison `/compare` | 8 | done |

## Email & recovery

| ID | Feature | Phase | Status |
|----|---------|-------|--------|
| F-090 | EmailModule + Resend templates | 14 | done |
| F-091 | Abandoned cart scheduler | 14 | done |
| F-092 | Recovery tracking (sent/clicked/recovered) | 14 | done |

## Admin & analytics

| ID | Feature | Phase | Status |
|----|---------|-------|--------|
| F-100 | Admin shell + navigation | 13 | done |
| F-101 | Catalog / hardware CRUD | 13 | done |
| F-102 | Orders / customers / inventory ops | 13 | done |
| F-103 | Coupons / bundles / reviews moderation | 13 | done |
| F-104 | Dashboard KPIs + charts | 15 | done |
| F-105 | Builder analytics | 15 | done |
| F-106 | Abandoned cart analytics | 15 | done |

## Customer account

| ID | Feature | Phase | Status |
|----|---------|-------|--------|
| F-110 | Profile | 8 / 12 | done |
| F-111 | Orders history | 12 | done |
| F-112 | Saved builds | 7 / 12 | done |
| F-113 | Wishlist / addresses / reviews | 10 / 12 | done |

## SEO, security, quality

| ID | Feature | Phase | Status |
|----|---------|-------|--------|
| F-120 | Metadata, OG, sitemap, robots, JSON-LD | 16 | done |
| F-121 | Rate limiting, audit log, hardening | 16 | done |
| F-122 | Unit/integration/E2E critical paths | 17 | done |
| F-123 | 3D + query performance pass | 18 | done |
| F-124 | Production deployment | 19 | todo |

---

## How to update

After finishing work:

1. Set feature rows to `done` / `in_progress`.  
2. Update [`PROGRESS.md`](../PROGRESS.md) phase row.  
3. Log notable bugs in [`bugs.md`](./bugs.md).  
4. Do not mark a phase `done` if its critical features are still `todo`.
