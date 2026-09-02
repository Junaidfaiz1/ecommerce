# PROGRESS — VORQEN

> **Update this file at the end of every phase.**  
> Agents: read this first. Implement only the **Current phase**.

## Current status

| Field | Value |
|-------|-------|
| **Current phase** | Phase 19 — Deployment |
| **Status** | ⬜ Pending |
| **Next phase** | — |
| **Blocked by** | — |

## Phase checklist

| # | Phase | Status |
|---|--------|--------|
| 1 | Monorepo + project foundation (Next.js-only) | ✅ Done |
| 2 | Database + Prisma schema | ✅ Done |
| 3 | Next.js GraphQL / server foundation | ✅ Done |
| 4 | Authentication + RBAC | ✅ Done |
| 5 | Catalog + hardware domain | ✅ Done |
| 6 | Compatibility Engine | ✅ Done |
| 7 | PC Builder | ✅ Done |
| 8 | Customer storefront | ✅ Done |
| 9 | 3D system | ✅ Done |
| 10 | Cart + wishlist | ✅ Done |
| 11 | Stripe + checkout | ✅ Done |
| 12 | Orders + inventory | ✅ Done |
| 13 | Admin panel | ✅ Done |
| 14 | Resend + abandoned cart | ✅ Done |
| 15 | Analytics | ✅ Done |
| 16 | SEO + security hardening | ✅ Done |
| 17 | Testing | ✅ Done |
| 18 | Performance optimization | ✅ Done |
| 19 | Deployment | ⬜ Pending |

**Legend:** ⬜ Not started · 🟡 In progress · ✅ Done · ⛔ Blocked

## What to do next (for agents)

1. Wait for the user to request **Phase 19**.
2. Phase 19 = Vercel + Neon + CI + `docs/deployment.md`.
3. Do not start Phase 19 until asked.

## Architecture decision

**NestJS removed.** VORQEN is a **Next.js-only** modular monolith:

- `apps/web` — UI + `/api/graphql` (Yoga) + `/api/health` + future webhooks/cron
- `apps/web/src/server/*` — domain services
- No `apps/api`

## Phase 18 verification

| Check | Result |
|-------|--------|
| 3D budget: DPR cap, off-screen/tab pause, constrained shadows/HDRI | Pass |
| Catalog list include: 1 image + 1 default variant | Pass |
| Shop meta+list and PDP reviews+3D in parallel | Pass |
| Prisma catalog indexes migration | Pass (SQL present) |
| `CatalogImage` / `next/image` on cards, PDP, cart, wishlist | Pass |
| `pnpm typecheck` / lint / test | Pass |
| Production deploy | Deferred Phase 19 |

## Phase 17 verification

| Check | Result |
|-------|--------|
| Domain unit tests (compat, coupons, inventory math, webhook signatures, RBAC, scheduler, analytics, security) | Pass |
| In-memory Prisma integration (cart, coupon, addBuildToCart gate, inventory idempotency, checkout webhook, orders, RBAC) | Pass |
| GraphQL client-authority contract (no paid/price/stock mutations from customers) | Pass |
| In-process E2E: build → cart → coupon → PaymentIntent stub → webhook PAID + SALE | Pass |
| Optional HTTP smoke (`E2E_BASE_URL`) | Skip unless origin set |
| `pnpm typecheck` / lint / `pnpm test` | Pass |
| 3D budgets / query / images | ✅ Phase 18 |

## Phase 16 verification

| Check | Result |
|-------|--------|
| Root + public page metadata / OG / canonicals | Pass |
| `robots.txt` + `sitemap.xml` (ACTIVE products) | Pass |
| JSON-LD Organization/WebSite + Product Offer (server price) | Pass |
| noindex on admin / account / auth / checkout / cart | Pass |
| GraphQL in-memory rate limits (auth/checkout/mutate/query) | Pass |
| Security headers + CSP; introspection off in production | Pass |
| Audit sanitize + staff `adminAuditLogs` / `/admin/audit` | Pass |
| Shared Zod/helpers (`@vorqen/types` security + seo) | Pass |
| `pnpm typecheck` / lint / test | Pass |
| Critical-path E2E | ✅ Phase 17 |

## Phase 15 verification

| Check | Result |
|-------|--------|
| Staff `adminAnalytics` (7d / 30d / 90d) | Pass |
| Revenue KPIs (gross, refunds, net, AOV) from paid orders | Pass |
| Daily revenue + order-status charts | Pass |
| Builder saves, visibility, top parts | Pass |
| Abandoned-cart funnel + recovery/click rates | Pass |
| Shared window/series helpers (`@vorqen/types` analytics) | Pass |
| Recharts on `/admin` (dense ops UI) | Pass |
| `pnpm typecheck` / lint / test | Pass |
| SEO / rate limits | Deferred Phase 16 |

## Phase 14 verification

| Check | Result |
|-------|--------|
| Resend client + HTML/text templates | Pass |
| Auth verify / reset emails (skip if unconfigured) | Pass |
| Order-paid email after webhook (failure does not fail webhook) | Pass |
| Cron `GET/POST /api/cron/abandoned-cart` + `CRON_SECRET` | Pass |
| Idle 1h / reminder 24h / expire 7d / max 2 emails | Pass |
| Click `GET /api/email/abandoned/[id]` → `/cart` | Pass |
| Recovered on paid webhook | Pass |
| Signed-in carts only (guest without email skipped) | Pass |
| Shared scheduler (`@vorqen/types` email) + unit tests | Pass |
| `pnpm typecheck` / lint / test | Pass |
| Admin analytics charts | Pass (Phase 15) |

## Phase 13 verification

| Check | Result |
|-------|--------|
| Admin shell `/admin` (distinct ops UI) | Pass |
| Middleware ADMIN / SUPPORT | Pass |
| Catalog upsert (drafts visible; storefront ACTIVE-only) | Pass |
| Order fulfillment transitions (never mark paid) | Pass |
| Stripe refund + remaining amount on server | Pass |
| Inventory ADJUSTMENT (on-hand ≥ reserved) | Pass |
| Coupon / bundle upsert + review moderate | Pass |
| Audit log on admin mutations | Pass |
| Shared Zod (`@vorqen/types` admin) | Pass |
| Unit tests (transitions, refund remaining, schemas) | Pass |
| `pnpm typecheck` / lint / test | Pass |
| Admin panel (`/admin` ops KPIs) | Pass (Phase 13) |
| Dashboard charts / builder / recovery metrics | Pass (Phase 15) |

## Phase 12 verification

| Check | Result |
|-------|--------|
| Reserve on PaymentIntent create (`quantityReserved`) | Pass |
| Commit `SALE` in same txn as webhook `PAID` | Pass |
| Release on cancel / failed PI | Pass |
| Idempotent inventory txs per order + type | Pass |
| `myOrders` / `order` / `cancelPendingOrder` (own rows only) | Pass |
| `/account/orders` list + detail UI | Pass |
| Checkout success → order when `PAID` | Pass |
| Shared Zod (`@vorqen/types` inventory + orders) | Pass |
| Unit tests (reserve/commit/release + order schemas) | Pass |
| `pnpm typecheck` / lint / test | Pass |
| Admin order status / inventory ops UI | Deferred Phase 13 |

## Phase 11 verification

| Check | Result |
|-------|--------|
| Checkout UI `/checkout` (auth + shipping + server totals) | Pass |
| `createCheckoutSession` snapshots order PENDING_PAYMENT | Pass |
| Stripe PaymentIntent amount from server grand total | Pass |
| In-app Payment Element (no Checkout URL redirect) | Pass |
| Webhook signature verification | Pass |
| Paid only on `payment_intent.succeeded` + amount match | Pass |
| Success page shows processing until webhook PAID | Pass |
| Shared Zod (`@vorqen/types` checkout) | Pass |
| Unit tests (schemas, cents, paid-transition, signatures) | Pass |
| `pnpm typecheck` / lint / test | Pass |
| Inventory reserve / commit | ✅ Phase 12 |
| Customer order history | ✅ Phase 12 |

## Phase 10 verification

| Check | Result |
|-------|--------|
| Cart service (guest session + user merge) | Pass |
| Server price recalc + soft stock checks | Pass |
| Coupon apply/remove (BUILD10 hooks) | Pass |
| Wishlist CRUD + move to cart | Pass |
| `addBuildToCart` + compatibility gate | Pass |
| GraphQL cart / wishlist queries + mutations | Pass |
| `/cart` + `/wishlist` UI + navbar badge | Pass |
| PDP / ProductCard / builder CTAs | Pass |
| Shared Zod (`@vorqen/types` cart + coupon) | Pass |
| Unit tests (schemas + coupon math) | Pass |
| `pnpm typecheck` / lint / test | Pass |
| Stripe checkout | Deferred Phase 11 |

## Phase 9 verification

| Check | Result |
|-------|--------|
| R3F + drei + three deps | Pass |
| Homepage hero 3D (lazy) | Pass |
| Builder 3D + slot highlight / filled | Pass |
| PDP 3D viewer + explode / spin / fullscreen | Pass |
| Procedural demo + GLB/Draco path | Pass |
| `server/storage` R2 URL + keys | Pass |
| `server/three-d-assets` + GraphQL queries | Pass |
| Shared Zod (`@vorqen/types` three-d) | Pass |
| Unit tests (schemas + URL resolution) | Pass |
| `pnpm typecheck` / lint / test | Pass |
| Cart / wishlist CTAs | ✅ Phase 10 |

## Phase 8 verification

| Check | Result |
|-------|--------|
| Store shell (Navbar + Footer) | Pass |
| Homepage hero + featured / GPU sections | Pass |
| `/shop` search, filters, sort, pagination | Pass |
| PDPs `/products/[slug]` + `/gpu/[slug]` … | Pass |
| `/compare` (max 4, server prices/specs) | Pass |
| Account: profile, addresses, saved builds | Pass |
| GraphQL: addresses, profile, reviews, compare | Pass |
| Shared Zod (`@vorqen/types` account/reviews/compare) | Pass |
| Unit tests (storefront schemas + product paths) | Pass |
| `pnpm typecheck` / lint / test | Pass |
| Cart / wishlist CTAs | ✅ Phase 10 |
| Interactive 3D | ✅ Phase 9 |
| Bundles admin + review moderation UI | Deferred Phase 13 |

## Phase 7 verification

| Check | Result |
|-------|--------|
| `/build` multi-step UI (9 steps + Review) | Pass |
| Zustand draft selection only (prices/compat from server) | Pass |
| `previewBuild` → line items + total + compatibility | Pass |
| Save / update / duplicate / delete builds (auth) | Pass |
| Reopen via `?id=` / `?slug=` | Pass |
| `estimatePerformance` + labeled FPS estimates | Pass |
| Shared Zod (`@vorqen/types` builder + performance) | Pass |
| Unit tests (builder + performance schemas) | Pass |
| `pnpm typecheck` / lint / test | Pass |
| Add-to-cart CTA deferred | ✅ Phase 10 |
| Interactive 3D viewport | ✅ Phase 9 |

## Phase 6 verification

| Check | Result |
|-------|--------|
| Pure `evaluateCompatibility` engine | Pass |
| Named power constants (`PLATFORM_OVERHEAD_WATTS`, `PSU_SAFETY_MARGIN_RATIO`) | Pass |
| Service resolves ACTIVE products + slot type checks | Pass |
| GraphQL `checkCompatibility` → compatible / errors / warnings / recommendations | Pass |
| Shared Zod (`@vorqen/types` compatibility schemas) | Pass |
| Unit tests (sockets, RAM, GPU length, PSU, cooler, happy path) | Pass |
| `pnpm typecheck` / lint | Pass |

## Phase 5 verification

| Check | Result |
|-------|--------|
| Catalog service (brands, categories, products, variants) | Pass |
| Typed hardware specs on product (CPU/GPU/MB/RAM/…) | Pass |
| Server search + filters + sort + pagination | Pass |
| GraphQL: `brands`, `brand`, `categories`, `category`, `products`, `product`, `productVariant` | Pass |
| Shared Zod catalog schemas (`@vorqen/types`) | Pass |
| Public catalog ACTIVE-only; prices/stock from DB | Pass |
| Unit tests (`catalog.test.ts`) | Pass |
| `pnpm typecheck` / lint | Pass |

## Phase 4 verification

| Check | Result |
|-------|--------|
| JWT access + refresh (jose) + httpOnly cookies | Pass |
| Register / login / logout / refreshAuth | Pass |
| RBAC helpers + `/admin` middleware | Pass |
| bcrypt password hashing | Pass |
| Email verify + password reset (Resend; logs link in non-prod) | Pass |
| GraphQL `me` + auth mutations | Pass |
| Auth UI: `/login`, `/register`, forgot/reset/verify | Pass |
| Unit tests (`auth.test.ts`) | Pass |
| `pnpm typecheck` / lint | Pass |

## Phase 3 verification

| Check | Result |
|-------|--------|
| Yoga + GraphiQL (non-prod) | Pass |
| Context + Prisma | Pass |
| DomainError + masked errors | Pass |
| Zod `parseOrThrow` on `ping` | Pass |
| Depth + complexity rules | Pass |
| Queries: health / ping / serverInfo | Pass |
| `pnpm typecheck` | Pass |
| `pnpm lint` | Pass |

## Phase 2 verification

| Check | Result |
|-------|--------|
| Full Prisma schema (commerce + hardware) | Pass |
| Initial migration `20260824180000_init` | Pass |
| `pnpm db:generate` | Pass |
| Field docs `docs/database.md` | Pass |
| Seed `prisma/seed.ts` | Pass (script ready) |
| Apply to DB | Needs running Postgres — `pnpm exec prisma migrate deploy && pnpm db:seed` |

| 2026-09-02 | **Storefront** — catalog photos replace R3F on hero, builder, PDP, and compare. |
| 2026-09-02 | **Storefront** — homepage How it works + Performance showcase (server FPS samples; seed 1080p/1440p/4K). |
| 2026-09-02 | **3D** — studio mid-tower (smoked glass + internals, hardware PBR); charcoal studio scene (not city/blue HDRI). |
| 2026-09-01 | **Admin** — product image upload (DB `ProductImage` + R2/local `/uploads`); storefront shows stored URLs; ops shell + dashboard charts (area/donut/funnel). |
| 2026-09-01 | **Fix** — navbar Sign out when signed in; staff login → `/admin`; removed duplicate `/build` header. |
| 2026-09-01 | **UI** — night glassmorphism storefront + auth (orbs, frost cards, gradient CTAs). Login returns to `next` via full navigation. Per-SKU catalog photos + procedural 3D on PDP/compare/builder. |
| 2026-09-01 | **Theme** — page background `#FBFBFB` on all routes; ice/sky/navy for surfaces, accent, and ink. |
| 2026-09-01 | **Fix** — catalog photos: local `/assets/catalog/product.jpg` fallback; seed no longer uses `placeholder.vorqen.local`. |
| 2026-09-01 | **Fix** — load repo-root `.env` in Next.js (`loadRootEnv`) so `DATABASE_URL` is available to Prisma. |
| 2026-09-01 | **Phase 18 complete** — 3D budgets, catalog list includes + indexes, `next/image` storefront. |
| 2026-09-01 | **Phase 17 complete** — in-memory integration + critical-path E2E (build→paid), GraphQL authority tests, `pnpm test` / typecheck / lint. |
| 2026-09-01 | **Phase 16 complete** — SEO metadata/sitemap/JSON-LD, GraphQL rate limits, audit hardening, security headers. |
| 2026-09-01 | **Phase 14 complete** — Resend templates, auth + order-paid email, abandoned-cart cron/click/recovered. |
| 2026-09-01 | **Phase 13 complete** — admin ops shell, catalog/orders/inventory/coupons/bundles/reviews, audit log, Stripe refunds. |
| 2026-09-01 | **Phase 12 complete** — inventory reserve/commit/release, `myOrders` / order detail, `/account/orders`. |
| 2026-09-01 | **Phase 11** — PaymentIntent + in-app Payment Element (no Checkout Session URL). Webhook `payment_intent.succeeded` is paid authority. |
| 2026-09-01 | **Phase 11 complete** — Stripe checkout, webhook as paid source of truth, `/checkout` UI. |
| 2026-08-25 | **Phase 10 complete** — server cart pricing, wishlist, coupons, `/cart` `/wishlist`, build add-to-cart. |
| 2026-08-25 | **Phase 9 complete** — R3F hero/builder/PDP viewers, explode, R2 storage URLs, GraphQL 3D assets. |
| 2026-08-25 | **Phase 8 complete** — storefront homepage/shop/PDP/compare, account shell, addresses/reviews GraphQL. |
| 2026-08-24 | **Phase 7 complete** — `/build` UI, previewBuild, save/duplicate, performance estimates. |
| 2026-08-24 | **Phase 6 complete** — CompatibilityEngine, GraphQL `checkCompatibility`, power constants, unit tests. |
| 2026-08-24 | **Phase 5 complete** — catalog/hardware services, GraphQL products/brands/categories, typed specs, filters/sort/pagination. |
| 2026-08-24 | **Phase 4 complete** — JWT/cookies, register/login/refresh, RBAC, auth GraphQL + UI, refresh/challenge tables. |
| 2026-08-24 | **Phase 3 complete** — Yoga foundation, context, DomainError/Zod, depth/complexity, docs/api.md. |
| 2026-08-24 | **Phase 2 complete** — full Prisma schema, init migration, seed, database.md. |
| 2026-08-24 | **Phase 1 complete** — monorepo, Next.js, GraphQL health stub, Prisma foundation. |
| 2026-08-24 | NestJS dropped; no Docker; latest-versions policy. |

## Links

- Project status: [`docs/project-status.md`](./docs/project-status.md)
- Features: [`docs/features.md`](./docs/features.md)
- API: [`docs/api.md`](./docs/api.md)
- Compatibility: [`docs/compatibility-engine.md`](./docs/compatibility-engine.md)
- PC Builder: [`docs/pc-builder.md`](./docs/pc-builder.md)
- 3D: [`docs/3d-system.md`](./docs/3d-system.md)
- Bugs: [`docs/bugs.md`](./docs/bugs.md)
- Phases: [`docs/phases.md`](./docs/phases.md)
- Database: [`docs/database.md`](./docs/database.md)
