# Development Phases — VORQEN

Work **one phase at a time**. Sync with [`../PROGRESS.md`](../PROGRESS.md) and [`features.md`](./features.md).

---

## Phase 1 — Monorepo + project foundation

**Goal:** Runnable Next.js-only monorepo + tooling + docs.

**Deliver:**

- pnpm workspace + Turborepo
- `apps/web` (Next.js + TS + Tailwind + shadcn foundation)
- Server domain folder placeholders under `apps/web/src/server/`
- GraphQL health stub at `/api/graphql` (Yoga)
- `packages/ui`, `packages/types`, `packages/config`
- Prisma foundation (minimal schema) + `DATABASE_URL` (Neon / native Postgres — **no Docker**)
- ESLint, Prettier, `.env.example`
- README + architecture docs

**Exit criteria:** typecheck + lint pass; Next.js starts; GraphQL health works; DB URL configured.

**No NestJS. No `apps/api`. No Docker.**

---

## Phase 2 — Database + Prisma schema

**Goal:** Full commerce + hardware Prisma models, migration, seed, field docs.

**Deliver:**

- Full `prisma/schema.prisma` (identity, catalog, hardware, builder, commerce, inventory, marketing, system)
- Typed hardware specs (CPU/GPU/MB/RAM/Storage/PSU/Case/Cooler)
- Initial migration under `prisma/migrations/`
- Seed with compatible + incompatible builds (`pnpm db:seed`)
- Field-level docs in `docs/database.md`

**Exit criteria:** schema generates; migration SQL present; seed runnable; database.md updated.

---

## Phase 3 — Next.js GraphQL / server foundation

**Goal:** Production-shaped GraphQL surface inside Next.js (not NestJS).

**Deliver:**

- Yoga at `/api/graphql` with GraphiQL (non-prod)
- GraphQL context (`prisma`, `userId` placeholder, `request`)
- Domain errors + masked error mapping (`extensions.code`)
- Zod arg validation helper (`parseOrThrow`)
- Query depth + complexity validation rules
- Foundation queries: `health`, `ping`, `serverInfo`
- Docs: `docs/api.md`

**Exit criteria:** typecheck + lint; GraphQL health/ping/serverInfo work; errors use stable codes.

---

## Phase 4 — Authentication + RBAC

**Goal:** JWT sessions, register/login, RBAC, password hashing, secure cookies.

**Deliver:**

- Access + refresh JWTs (`jose`) with httpOnly cookies (`vorqen_access` / `vorqen_refresh`)
- Refresh token rotation + hashed storage (`refresh_tokens`)
- Auth challenges for email verify + password reset (`auth_challenges`)
- bcrypt password hashing; shared Zod auth schemas in `@vorqen/types`
- GraphQL: `me`, `register`, `login`, `logout`, `refreshAuth`, verify/reset mutations
- Context loads `user` / `userId` from cookie or `Authorization: Bearer`
- RBAC helpers (`requireUser`, `requireRoles`, `requireAdmin`, `requireStaff`)
- Middleware guards `/admin/*` (ADMIN / SUPPORT)
- Auth UI: `/login`, `/register`, `/forgot-password`, `/reset-password`, `/verify-email`
- Unit tests for password policy, hashing, RBAC

**Exit criteria:** typecheck + lint + auth unit tests; login sets cookies; `me` returns user; admin routes redirect when unauthenticated.

**Note:** Resend delivery for verify/reset emails lands in Phase 14 — links are logged in development.

---

## Phase 5 — Catalog + hardware domain

**Goal:** Public catalog + typed hardware GraphQL APIs (read path). Admin CRUD is Phase 13; storefront PDPs are Phase 8.

**Deliver:**

- Catalog service: brands, categories, products, variants
- Typed hardware specs attached to products (CPU/GPU/MB/RAM/Storage/PSU/Case/Cooler)
- Server-side search, filters, sort, pagination (ACTIVE-only public list)
- Shared Zod schemas in `@vorqen/types`
- GraphQL: `brands`, `brand`, `categories`, `category`, `products`, `product`, `productVariant`
- Unit tests for filter / pagination helpers

**Exit criteria:** typecheck + lint + catalog unit tests; GraphQL returns seeded products with hardware specs when DB is seeded.

---

## Phase 6 — Compatibility Engine

**Goal:** Server-only compatibility authority over typed hardware specs.

**Deliver:**

- Pure `evaluateCompatibility` engine + named power constants
- Service loads ACTIVE products by ID, validates slot ↔ product type, maps specs
- GraphQL `checkCompatibility(input)` → `compatible`, `errors`, `warnings`, `recommendations`, wattage fields
- Shared Zod in `@vorqen/types`
- Unit tests for required rule pairs + happy path
- Docs: `docs/compatibility-engine.md`

**Exit criteria:** typecheck + lint + compatibility unit tests; GraphQL returns engine results for product ID selections.

**No builder UI** (Phase 7).

---

## Phase 7 — PC Builder

**Goal:** `/build` UI + APIs for builds, live compatibility, performance estimates, save build.

**Deliver:**

- Multi-step `/build` UI (CPU → … → Cooling → Review)
- Zustand draft selection; server `previewBuild` for price + compatibility
- GraphQL: `previewBuild`, `myBuilds`, `build`, `saveBuild`, `duplicateBuild`, `deleteBuild`
- Performance: `games`, `estimatePerformance` (benchmark rows; labeled estimates)
- Shared Zod in `@vorqen/types`; unit tests for schemas / pricing helpers

**Exit criteria:** typecheck + lint + builder/performance tests; save/reopen works when authenticated; live totals never from client.

**Deferred:** add-to-cart (Phase 10), interactive 3D (Phase 9).

---

## Phase 8 — Customer storefront

**Goal:** Public marketing + catalog UX on top of Phase 5 GraphQL; account shell with profile/addresses.

**Deliver:**

- Store shell: Navbar + Footer; homepage with hero + featured sections (3D placeholder → Phase 9)
- Shop browse: search, type/brand/category filters, sort, pagination (`/shop`)
- Shared `ProductCard`, `Price`, `StockBadge`, empty/error states
- PDPs: `/products/[slug]` + type paths (`/gpu/[slug]`, …) with specs + approved reviews
- Compare: `/compare` (selection tray + side-by-side specs; max 4)
- Account shell: `/account` profile, addresses CRUD, link to saved builds
- GraphQL: `myAddresses`, address CRUD, `updateProfile`, `productReviews`, `createReview`
- Shared Zod in `@vorqen/types` (address, profile, review, compare)
- Unit tests for address/review schema helpers

**Exit criteria:** typecheck + lint + new unit tests; shop/PDP/compare/account render with catalog APIs; prices/stock from server.

**Deferred:** cart/wishlist actions (Phase 10), interactive 3D (Phase 9), review moderation UI (Phase 13), bundles admin (Phase 13).

---

## Phase 9 — 3D system

**Goal:** Hero, builder, and PDP 3D viewers with explode, lazy GLB/Draco, and R2-backed asset URLs.

**Deliver:**

- R3F + Three.js + drei in `apps/web` (dynamic import, no checkout)
- Procedural demo chassis + per-type PDP parts until licensed GLBs ship
- Exploded view, auto-rotate, fullscreen controls
- Builder slot highlight + filled-slot opacity
- `server/storage` (R2 public URL + keys) and `server/three-d-assets`
- GraphQL: `product3DAssets`, `productViewerAsset`
- Shared Zod in `@vorqen/types` (`three-d.ts`)
- Unit tests for URL resolution + schemas

**Exit criteria:** typecheck + lint + three-d unit tests; homepage /build / PDP show interactive viewers; R2 secrets never exposed to the client.

---

## Phase 10 — Cart + wishlist

**Goal:** Server-authoritative cart pricing, wishlist, and coupon validation hooks (no Stripe yet).

**Deliver:**

- Cart service: guest session cookie + authenticated carts, merge on sign-in
- Server recalculation of line prices / totals from ACTIVE variants + inventory soft checks
- Coupon evaluate/apply/remove (`BUILD10` seed) — discount math never from client
- Wishlist CRUD (auth) + move item to cart
- `addBuildToCart` with hard compatibility gate
- GraphQL: `cart`, `wishlist`, cart/wishlist mutations
- UI: `/cart`, `/wishlist`, PDP/card CTAs, navbar badge, builder add-to-cart
- Shared Zod in `@vorqen/types` (`cart.ts`, `coupon.ts`); unit tests for coupon math + schemas

**Exit criteria:** typecheck + lint + cart unit tests; cart totals never trusted from client; checkout CTA deferred to Phase 11.

---

## Phase 11 — Stripe + checkout

**Goal:** Checkout UI, Stripe **PaymentIntent** + Payment Element, **webhook as source of truth** for paid.

**Deliver:**

- `/checkout` (auth) — shipping address + server cart totals + in-app Stripe Payment Element
- `createCheckoutSession` snapshots a `PENDING_PAYMENT` order and returns a PaymentIntent `clientSecret`
- Route Handler `POST /api/webhooks/stripe` — verify signature, then payload Zod
- Mark `PAID` / payment `SUCCEEDED` only on `payment_intent.succeeded` when amount + currency match the order
- `/checkout/success` shows **processing** until webhook confirms — never from `confirmPayment` alone
- `/checkout/cancel` — no charge; cart unchanged
- Shared Zod in `@vorqen/types` (`checkout.ts`); unit tests for cents, paid-transition, signatures

**Exit criteria:** typecheck + lint + checkout unit tests; client cannot mark an order paid.

**Deferred to Phase 12:** inventory reserve/commit, customer order history.

---

## Phase 12 — Orders + inventory

**Goal:** Order lifecycle, inventory transactions, customer order views.

**Deliver:**

- Reserve stock when a checkout PaymentIntent is created (`RESERVE`, on-hand unchanged)
- Commit stock on webhook `PAID` (`SALE`) in the same transaction as the paid status write
- Release reservations on cancel / failed / cancelled PaymentIntent (`RELEASE`)
- Idempotent inventory txs keyed by `orderId` + inventory + type
- GraphQL: `myOrders`, `order`, `cancelPendingOrder` (own orders only; no customer status overrides)
- Account UI: `/account/orders` list + `/account/orders/[id]` detail
- Checkout success links to the order after webhook `PAID`
- Shared Zod in `@vorqen/types` (`inventory.ts`, `orders.ts`); unit tests for reserve/commit/release math

**Exit criteria:** typecheck + lint + inventory/order unit tests; clients cannot set order paid or mutate inventory.

**Deferred to Phase 13:** admin order status ops, inventory adjustments UI, refunds.

---

## Phase 13 — Admin panel

**Goal:** Distinct ops UI for catalog, hardware, orders, inventory, coupons, bundles, and review moderation.

**Deliver:**

- `/admin` shell (dense ops UI, not storefront chrome); middleware ADMIN / SUPPORT
- Catalog: list all statuses, upsert product / variant / brand / category; typed hardware on upsert (CPU/GPU forms in UI)
- Orders: staff list/detail, fulfillment transitions (never mark paid); ADMIN Stripe refunds + optional restock
- Customers: list + ADMIN activate/deactivate
- Inventory: list / low-stock filter / ADJUSTMENT transactions
- Coupons + bundles upsert; review approve/reject
- Audit log writes for admin-critical mutations
- Shared Zod in `@vorqen/types` (`admin.ts`); unit tests for transitions, refund remaining, schemas

**Exit criteria:** typecheck + lint + admin unit tests; customers cannot hit admin GraphQL; paid status still webhook-only.

**Deferred to Phase 15:** dashboard charts / KPIs.

---

## Phase 14 — Resend + abandoned cart

**Goal:** Transactional email via Resend + abandoned-cart recovery on a cron Route Handler (no Redis/BullMQ/Nest).

**Deliver:**

- Resend client (`RESEND_API_KEY` / `RESEND_FROM_EMAIL`); skip send when unconfigured
- Templates: verify email, password reset, order paid, abandoned cart (1 + reminder)
- Auth register / reset / resend-verification send mail (non-prod still logs the link)
- Order confirmation after Stripe webhook `PAID` (email failure must not fail the webhook)
- Cron `GET/POST /api/cron/abandoned-cart` with `Authorization: Bearer ${CRON_SECRET}`
- Signed-in carts only; idle 1h, reminder 24h, expire 7d, max 2 emails
- Click `GET /api/email/abandoned/[id]` marks clicked and redirects to `/cart`
- Recovered status on paid webhook; empty / stale open records expire
- Shared pure scheduler in `@vorqen/types` (`decideAbandonedCartAction`) with injected `now`
- Hourly Vercel cron stub in `apps/web/vercel.json` (full deploy is Phase 19)

**Exit criteria:** typecheck + lint + scheduler/template unit tests; no Redis/BullMQ; clients cannot forge recovery state.

**Deferred to Phase 15:** abandoned-cart analytics charts.

---

## Phase 15 — Analytics

**Goal:** Admin KPIs and charts for revenue, builder activity, and abandoned-cart recovery. All metrics computed on the server.

**Deliver:**

- Shared UTC window helpers + rate/AOV math in `@vorqen/types` (`analytics.ts`); inject `now` in tests
- Staff GraphQL `adminAnalytics(input: { range: 7d \| 30d \| 90d })`
- Revenue: paid-order gross, succeeded refunds, net, AOV, daily net series
- Builder: saves per day, visibility mix, top parts in saved builds
- Abandoned cart: status mix, email/click/recovery funnel and rates
- `/admin` overview: KPI cards + Recharts (ops counts remain live, not range-windowed)

**Exit criteria:** typecheck + lint + analytics unit tests; customers cannot query analytics; clients cannot send computed totals.

**Deferred to Phase 16:** SEO metadata, rate limits, audit log hardening.

---

## Phase 16 — SEO + security

**Goal:** Public SEO (metadata, sitemap, structured data) plus GraphQL rate limits and audit-log hardening. No Redis.

**Deliver:**

- Root + page metadata (`metadataBase`, Open Graph, Twitter, canonicals)
- `robots.txt` + `sitemap.xml` (static public routes + ACTIVE product URLs)
- JSON-LD: Organization / WebSite on home, Product+Offer on PDPs (server prices)
- noindex on admin, account, auth, cart, wishlist, checkout
- In-memory sliding-window rate limits on GraphQL (auth / checkout / mutate / query buckets)
- HTTP security headers + CSP; GraphQL introspection off in production
- Audit log: canonical actions, metadata sanitization, `createdAt`/`action` indexes, staff `adminAuditLogs` + `/admin/audit`

**Exit criteria:** typecheck + lint + security unit tests; robots/sitemap routes exist; clients cannot set prices in JSON-LD or bypass rate limits.

**Deferred to Phase 17:** full critical-path test suite / E2E.

---

## Phase 17 — Testing

**Goal:** Critical-path unit, integration, and smoke coverage for money, stock, auth, compatibility, and payments.

**Deliver:**

- Keep existing domain unit tests (compat, coupons, inventory math, webhook signatures, RBAC, abandoned-cart scheduler, analytics, security)
- In-memory Prisma integration tests for cart pricing, coupons, `addBuildToCart` compatibility gate, inventory reserve/commit/release idempotency, checkout snapshot + webhook paid/reject/cancel, order ownership, GraphQL/middleware RBAC
- In-process E2E: saved build → cart → coupon → PaymentIntent stub → `payment_intent.succeeded` → PAID + stock SALE
- Optional HTTP smoke (`E2E_BASE_URL`) for `/api/health`, public routes, and checkout auth redirect
- `pnpm test` glob runner (`apps/web/scripts/run-tests.mjs`); `pnpm test:e2e` for the critical-path + HTTP smoke files

**Exit criteria:** typecheck + lint + `pnpm test`; clients still cannot set prices, stock, compatibility, roles, or paid status.

**Deferred to Phase 18:** 3D budgets, query efficiency, images.

---

## Phase 18 — Performance optimization

**Goal:** 3D frame budgets, slimmer catalog queries, and `next/image` for storefront media.

**Deliver:**

- Shared `resolveThreeDBudget` (`@vorqen/types` `perf.ts`) + `SceneCanvas` pause/DPR/shadow/HDRI caps
- Catalog list include: 1 primary image + 1 default variant; shop meta+list in parallel; PDP reviews+3D in parallel
- Prisma indexes on `products(status, is_featured)`, `(status, created_at)`, variant price sort, image primary
- `CatalogImage` (`next/image`, AVIF/WebP, sizes) on cards, PDP, cart, wishlist
- Unit tests for budget helpers + list-include caps

**Exit criteria:** typecheck + lint + `pnpm test`; 3D still lazy-only on hero/builder/PDP; list queries do not load full galleries.

**Deferred to Phase 19:** Vercel + Neon + CI deploy.

---

## Phase 19 — Deployment

Vercel + Neon + CI + `docs/deployment.md`.

---

## Phase completion checklist

1. Scope implemented (no fake core flows)
2. Typecheck pass
3. Lint pass
4. Tests pass (if present)
5. App still starts
6. `PROGRESS.md` + `features.md` updated
7. Bugs logged in `bugs.md`
8. Stop — wait for user before next phase
