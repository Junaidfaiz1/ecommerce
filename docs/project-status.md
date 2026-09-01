# VORQEN — Project Status & Functional Requirements

> **Aasaan summary:** is file mein likha hai ke **kya ho chuka**, **kya baqi hai**, **functional requirements kya hain**, aur **kaun se features implement ho chuke hain**.  
> Agents / live checklist: [`../PROGRESS.md`](../PROGRESS.md) · [`features.md`](./features.md)

**Last updated:** 2026-09-01  
**Product:** VORQEN — Premium gaming hardware marketplace + PC Builder  
**Tagline:** Build Beyond Limits.

---

## 1. Short overview (mukhtasar haal)

| Item | Status |
|------|--------|
| Overall progress | **Phase 17 / 19 complete** (~89%) |
| Current phase | Phase 18 — Performance optimization (**not started**) |
| Next work | Phase 18 when the user requests it |
| Architecture | Next.js-only modular monolith (NestJS / Docker / Redis nahi) |

---

## 2. Kya ho gaya (Done)

### Phase 1 — Monorepo + project foundation ✅

| # | Kaam | Detail |
|---|------|--------|
| 1 | pnpm + Turborepo monorepo | Workspace ready |
| 2 | Next.js app (`apps/web`) | App Router, TS, Tailwind foundation |
| 3 | GraphQL health stub | `/api/graphql` (Yoga) ping/health |
| 4 | Health route | `/api/health` |
| 5 | Shared packages | `packages/ui`, `packages/types`, `packages/config` |
| 6 | Prisma foundation | Minimal schema + `DATABASE_URL` (Neon / native Postgres) |
| 7 | Tooling | ESLint, Prettier, strict TypeScript |
| 8 | Env + docs | `.env.example`, README, architecture / stack docs |
| 9 | Cursor rules | Phase workflow, security, no-Docker, latest versions |
| 10 | Stack decision | NestJS hata diya; Next.js-only; no Docker |

### Phase 2 — Database + Prisma schema ✅

| # | Kaam | Detail |
|---|------|--------|
| 1 | Full Prisma schema | Identity, catalog, hardware, builder, commerce, inventory, marketing, system |
| 2 | Typed hardware models | Cpu, Gpu, Motherboard, Ram, StorageDrive, Psu, PcCase, Cooler |
| 3 | Initial migration | `prisma/migrations/20260824180000_init` |
| 4 | Seed script | Compatible + incompatible builds (`pnpm db:seed`) |
| 5 | Field docs | `docs/database.md` |

**DB apply:** Postgres chal raha ho to: `pnpm exec prisma migrate deploy` phir `pnpm db:seed`.

### Phase 3 — Next.js GraphQL / server foundation ✅

| # | Kaam | Detail |
|---|------|--------|
| 1 | Yoga + GraphiQL | `/api/graphql` (GraphiQL non-prod) |
| 2 | Context | `prisma`, `userId`, `user`, `request` |
| 3 | Domain errors | Stable `extensions.code` via maskedErrors |
| 4 | Zod validation | `parseOrThrow` + `ping` example |
| 5 | Depth / complexity | max depth 8, max ~150 fields |
| 6 | Queries | `health`, `ping`, `serverInfo` |

### Phase 4 — Authentication + RBAC ✅

| # | Kaam | Detail |
|---|------|--------|
| 1 | JWT + cookies | Access 15m + refresh 7d (`jose`, httpOnly) |
| 2 | Auth service | Register, login, logout, refresh rotation |
| 3 | Password hashing | bcryptjs |
| 4 | RBAC | `requireUser` / roles; middleware on `/admin` |
| 5 | Challenges | Email verify + password reset tokens (Resend later) |
| 6 | GraphQL + UI | `me` + auth mutations; login/register pages |
| 7 | Migration | `20260824200000_auth_tokens` |

### Phase 5 — Catalog + hardware domain ✅

| # | Kaam | Detail |
|---|------|--------|
| 1 | Catalog service | Brands, categories, products, variants |
| 2 | Typed hardware | CPU/GPU/MB/RAM/Storage/PSU/Case/Cooler on product |
| 3 | Search / filters | Query, type, brand, category, price, stock, featured |
| 4 | Sort + pagination | NAME / PRICE / NEWEST / FEATURED; pageSize ≤ 48 |
| 5 | GraphQL | `brands`, `categories`, `products`, `product`, `productVariant` |
| 6 | Shared Zod | `@vorqen/types` catalog schemas |
| 7 | Tests | `catalog.test.ts` filter/pagination |

### Phase 6 — Compatibility Engine ✅

| # | Kaam | Detail |
|---|------|--------|
| 1 | Pure engine | `evaluateCompatibility` over typed specs |
| 2 | Service | Resolve ACTIVE products by ID; slot ↔ type checks |
| 3 | Power | Named overhead + 20% PSU safety margin |
| 4 | GraphQL | `checkCompatibility` → compatible / errors / warnings / recommendations |
| 5 | Shared Zod | `@vorqen/types` compatibility schemas |
| 6 | Tests | Socket, RAM, GPU length, PSU, cooler, happy path |

### Phase 7 — PC Builder ✅

| # | Kaam | Detail |
|---|------|--------|
| 1 | `/build` UI | Multi-step picker + summary (Zustand draft) |
| 2 | Live preview | `previewBuild` — server prices + compatibility |
| 3 | Persistence | `saveBuild` / `duplicateBuild` / `deleteBuild` / reopen |
| 4 | Performance | `estimatePerformance` FPS from benchmarks (labeled) |
| 5 | Shared Zod | `@vorqen/types` builder + performance schemas |
| 6 | Tests | Builder + performance unit tests |

### Verification (Phase 1–7)

| Check | Result |
|-------|--------|
| `pnpm typecheck` / lint | Pass |
| Schema + migration SQL | Pass |
| GraphQL foundation | Pass |
| Auth unit tests | Pass |
| Catalog unit tests | Pass |
| Compatibility unit tests | Pass |
| Builder + performance unit tests | Pass |
| Seed script | Pass (DB up hone par run) |

### Implemented feature IDs (`done`)

| ID | Feature |
|----|---------|
| F-001 … F-008 | Platform foundation (Phase 1) |
| F-010 … F-012 | Database schema / migrations / seed (Phase 2) |
| F-020 … F-023 | GraphQL Yoga, validation, depth/complexity (Phase 3) |
| F-021 | Prisma client module / health check |
| F-030 … F-034 | Auth JWT, cookies, verify/reset tokens, RBAC (Phase 4) |
| F-040 … F-043 | Catalog products/brands/categories, typed specs, search/filter/sort |
| F-050 … F-051 | CompatibilityEngine + rules / GraphQL response shape (Phase 6) |
| F-052 … F-054 | Builder UI, live price/compat, save/reopen/duplicate (Phase 7) |
| F-060 … F-062 | Games/benchmarks model usage + FPS estimates + labeling (Phase 7) |

**Matlab:** foundation through customer storefront ready. Cart / 3D / Stripe — **baad ke phases**.

---

## 3. Kya reh gaya (Remaining)

### Phases 8 → 19 (pending)

| # | Phase | Status |
|---|--------|--------|
| 8 | Customer storefront | ✅ Done |
| 9 | 3D system (R3F) | ✅ Done |
| 10 | Cart + wishlist | ✅ Done |
| 11 | Stripe + checkout | ✅ Done |
| 12 | Orders + inventory | ✅ Done |
| 13 | Admin panel | ✅ Done |
| 14 | Resend + abandoned cart | ✅ Done |
| 15 | Analytics | ✅ Done |
| 16 | SEO + security hardening | ✅ Done |
| 17 | Testing (critical paths) | ✅ Done |
| 18 | Performance optimization | ⬜ Pending |
| 19 | Deployment (Vercel + Neon + CI) | ⬜ Pending |

### Abhi pending major product features

- Interactive 3D PC viewer (hero, builder, PDP) — ✅ Phase 9 (procedural demo + R2 GLB path)
- Cart, wishlist, coupons, checkout, Stripe webhook — ✅ Phases 10–11
- Orders + inventory transactions — ✅ Phase 12
- Admin CRUD — ✅ Phase 13; KPIs/charts — ✅ Phase 15
- Email (Resend) + abandoned-cart recovery — ✅ Phase 14
- SEO, rate limits, audit log — ✅ Phase 16
- Critical-path tests — ✅ Phase 17
- Performance pass + production deploy  

Detailed feature rows: [`features.md`](./features.md).

---

## 4. Functional requirements (project kya karna chahiye)

Yeh **business / product requirements** hain — end product mein yeh capabilities honi chahiye.

### FR-01 — Platform & identity

- Premium gaming hardware marketplace (neon “cheap RGB” UI nahi).  
- Brand feel: hardware laboratory + high-end configurator.  
- Single Next.js app: UI + GraphQL + webhooks + cron.

### FR-02 — Catalog & browsing

- Products, variants, images, brands, categories.  
- Typed hardware specs (CPU, GPU, motherboard, RAM, storage, PSU, case, cooling).  
- Server-side search, filters, sort, pagination.  
- Product detail pages (e.g. `/gpu/[slug]`).  
- Product comparison (`/compare`).  
- Bundles (optional / admin-managed).

### FR-03 — Compatibility Engine (core differentiator)

- Server-side `CompatibilityEngine` — client result par trust nahi.  
- Output: `compatible`, `errors`, `warnings`, `recommendations`.  
- Save / add-to-cart se pehle server par re-validate.

### FR-04 — PC Builder

- Route `/build` — multi-step: CPU → GPU → MB → RAM → Storage → PSU → Case → Cooling → Review.  
- Live price (backend), compatibility status, recommendations.  
- Estimated FPS / power (clear “estimated” label).  
- Save / reopen / duplicate builds.  
- Poori build cart mein add.

### FR-05 — 3D visualization

- Homepage hero 3D PC.  
- Builder mein interactive 3D + component highlight.  
- Product detail 3D viewer + exploded view.  
- Lazy GLB / Draco; assets on Cloudflare R2.

### FR-06 — Auth & accounts

- Register, login, refresh JWT, secure cookies.  
- Email verification, password reset.  
- RBAC: customer / admin (aur future roles).  
- Profile, addresses, orders history, saved builds, wishlist.

### FR-07 — Commerce

- Wishlist.  
- Cart with **server price recalculation** (client price trust nahi).  
- Coupons (server-validated).  
- Checkout steps + Stripe Checkout / Payment session.  
- **Stripe webhook = payment source of truth** (UI se “paid” mark nahi).  
- Orders lifecycle + inventory transactions.  
- Reviews (+ images where applicable).

### FR-08 — Admin

- Separate admin UI (ops look, storefront se alag).  
- Catalog / hardware CRUD.  
- Orders, customers, inventory ops.  
- Coupons, bundles, review moderation.  
- Dashboard KPIs, charts, builder + abandoned-cart analytics.

### FR-09 — Email & recovery

- Resend templates (verify, reset, order, abandoned cart).  
- Abandoned-cart cron (Redis/BullMQ ke bina).  
- Recovery tracking: sent / clicked / recovered.

### FR-10 — Trust, security, quality

- Never trust client for: price, stock, compatibility, roles, payment state.  
- Input validation (Zod) har mutation par — server authoritative.  
- Rate limiting, audit log for admin-critical actions.  
- SEO: metadata, OG, sitemap, robots, JSON-LD.  
- Tests for money, stock, auth, compatibility, Stripe webhook, orders.  
- Production: Vercel + Neon + CI; **no Docker**.

### Non-functional constraints (hard rules)

| Rule | Requirement |
|------|-------------|
| Stack | Next.js only — no NestJS / `apps/api` |
| Infra | No Docker; Postgres via Neon or native install |
| Architecture | Modular monolith — no Redis, BullMQ, Kafka, microservices |
| Money / stock | Server recompute only |
| Payments | Stripe webhook confirms paid state |

---

## 5. Features implement status (quick matrix)

| Area | Status | Notes |
|------|--------|-------|
| Monorepo / tooling / docs | ✅ Done | Phase 1 |
| Health + GraphQL foundation | ✅ Done | Phase 3 — domain APIs later |
| Database (full schema + migration + seed) | ✅ Done | Phase 2 — apply DB when Postgres up |
| Auth / RBAC | ✅ Done | Phase 4 |
| Catalog / hardware APIs | ✅ Done | Phase 5 public read; Phase 13 admin CRUD |
| Compatibility Engine | ✅ Done | Phase 6 — `checkCompatibility` GraphQL |
| PC Builder UI | ✅ Done | Phase 7 — `/build`, save, estimates |
| Storefront / PDP / compare | ✅ Done | Phase 8 |
| 3D system | ✅ Done | Phase 9 |
| Cart / wishlist | ✅ Done | Phase 10 |
| Stripe / checkout | ✅ Done | Phase 11 — PaymentIntent + webhook paid |
| Orders / inventory | ✅ Done | Phase 12 — reserve/commit + account history |
| Admin panel | ✅ Done | Phase 13 — `/admin` ops + staff GraphQL |
| Email / abandoned cart | ✅ Done | Phase 14 — Resend + cron recovery |
| Analytics | ✅ Done | Phase 15 — `/admin` KPIs + Recharts |
| SEO / security harden | ✅ Done | Phase 16 — metadata, sitemap, JSON-LD, rate limits, audit |
| Testing suite | ✅ Done | Phase 17 — unit + in-memory integration + build→paid E2E |
| Performance pass | ❌ Not started | Phase 18 |
| Deployment | ❌ Not started | Phase 19 |

---

## 6. Aghla qadam (Next)

1. User **Phase 18** request kare.
2. Phase 18 = 3D budgets, query efficiency, images.
3. Us se pehle Phase 18 start mat karo.
4. Local DB: Neon URL `.env` mein set karke `pnpm exec prisma migrate deploy && pnpm db:seed`.

---

## 7. Related docs

| File | Kaam |
|------|------|
| [`../PROGRESS.md`](../PROGRESS.md) | Current phase (agents pehle yeh padhein) |
| [`features.md`](./features.md) | Feature ID checklist (`done` / `todo`) |
| [`phases.md`](./phases.md) | Har phase ka scope + exit criteria |
| [`architecture.md`](./architecture.md) | System design |
| [`pc-builder.md`](./pc-builder.md) | Builder product spec |
| [`compatibility-engine.md`](./compatibility-engine.md) | Compat API contract |
| [`bugs.md`](./bugs.md) | Known bugs |

---

## How to keep this file fresh

Har phase complete hone ke baad:

1. Section **2 (Done)** aur **3 (Remaining)** update karo.  
2. Section **5** matrix update karo.  
3. Sync rakho with `PROGRESS.md` + `features.md`.
