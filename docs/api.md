# API — VORQEN

> **Phase 16 SEO + security** is live: sitemap/robots, JSON-LD, GraphQL rate limits, audit log UI.

## Style

- GraphQL Yoga at `GET/POST /api/graphql`
- Thin resolvers → `src/server/<domain>` services
- Stable error codes; no stack traces or Prisma messages to clients
- Zod validates resolver args (`parseOrThrow`)
- Query **depth** max `8` and **complexity** max `150` fields

## Endpoint

| Path | Role |
|------|------|
| `/api/graphql` | Yoga + GraphiQL (non-production) |
| `/api/health` | HTTP liveness / DB check |
| `/api/webhooks/stripe` | Payment events (signature-verified) |
| `/api/cron/abandoned-cart` | Abandoned-cart recovery (`GET`/`POST`; `Authorization: Bearer ${CRON_SECRET}`) |
| `/api/email/abandoned/[id]` | Click tracker → 302 `/cart` |
| `/api/admin/catalog/images` | **ADMIN** multipart product image upload (JPEG/PNG/WebP, magic-byte sniff, R2 or local `/uploads`) |
| `/sitemap.xml` | Public routes + ACTIVE product URLs |
| `/robots.txt` | Allow `/`; disallow admin/account/checkout/api |

## Current GraphQL operations

| Field | Type | Notes |
|-------|------|-------|
| `health` | Query | Status + optional `database` |
| `ping(echo)` | Query | Zod-validated echo / `pong` |
| `serverInfo` | Query | App name, env, DB probe via context Prisma |
| `me` | Query | Authenticated user or `null` |
| `register` | Mutation | Creates CUSTOMER; sets auth cookies |
| `login` | Mutation | Validates credentials; sets auth cookies |
| `logout` | Mutation | Revokes refresh row; clears cookies |
| `refreshAuth` | Mutation | Rotates refresh; issues new access |
| `requestPasswordReset` | Mutation | Always `{ ok }` (no email enumeration) |
| `resetPassword` | Mutation | Consumes challenge token |
| `verifyEmail` | Mutation | Consumes challenge token |
| `resendVerificationEmail` | Mutation | Requires auth |
| `brands` / `brand(slug)` | Query | Catalog brands |
| `categories` / `category(slug)` | Query | Catalog categories |
| `products(filter, sort, page, pageSize)` | Query | ACTIVE-only; search/filter/sort/paginate |
| `product(id \| slug)` | Query | Exactly one of id or slug; includes typed hardware |
| `productVariant(sku)` | Query | Active variant + parent product |
| `checkCompatibility(input)` | Query | Server engine: `compatible`, `errors`, `warnings`, `recommendations`, wattage |
| `previewBuild(input)` | Query | Server prices + nested compatibility for builder selection |
| `myBuilds` | Query | Auth — owned `PCBuild` list |
| `build(id \| slug)` | Query | Visibility-aware build load |
| `saveBuild` / `duplicateBuild` / `deleteBuild` | Mutation | Auth build persistence |
| `games` | Query | Benchmark game catalog |
| `estimatePerformance(input)` | Query | FPS samples for CPU+GPU (labeled estimates) |
| `myAddresses` | Query | Auth — saved addresses |
| `productReviews(input)` | Query | APPROVED reviews + average (public) |
| `compareProducts(input)` | Query | ACTIVE products by id (max 4) |
| `updateProfile` | Mutation | Auth — first/last name |
| `createAddress` / `updateAddress` / `deleteAddress` | Mutation | Auth address CRUD |
| `createReview` | Mutation | Auth — creates PENDING review |
| `cart` | Query | Guest session or signed-in cart |
| `wishlist` / `wishlistContains` | Query | Auth wishlist |
| `addToCart` / `updateCartItem` / `removeCartItem` / `clearCart` | Mutation | Server-priced cart |
| `applyCoupon` / `removeCoupon` | Mutation | Coupon math on server |
| `addBuildToCart` | Mutation | Hard compatibility gate |
| `addToWishlist` / `removeFromWishlist` / `moveWishlistItemToCart` | Mutation | Auth |
| `createCheckoutSession` | Mutation | Auth — snapshot order + PaymentIntent `clientSecret`; **reserves** inventory |
| `checkoutStatus` | Query | Auth — own order; paid only after webhook |
| `myOrders(input)` | Query | Auth — paginated own orders |
| `order(id)` | Query | Auth — own order detail |
| `cancelPendingOrder(id)` | Mutation | Auth — cancel `PENDING_PAYMENT`, release reservation |
| `adminOverview` / `adminAnalytics` / `adminProducts` / `adminOrders` / … | Query | Staff (`ADMIN`/`SUPPORT`) |
| `upsertAdminProduct` / `upsertAdminVariant` / brand / category | Mutation | **ADMIN** catalog write |
| `addAdminProductImage` / `updateAdminProductImage` / `deleteAdminProductImage` | Mutation | **ADMIN** — attach/reorder/remove gallery URLs stored on `ProductImage` |
| `updateAdminOrderStatus` | Mutation | Staff fulfillment only (cannot set `PAID`) |
| `refundAdminOrder` | Mutation | **ADMIN** — Stripe refund; amount recomputed vs remaining |
| `adjustInventory` | Mutation | **ADMIN** — `ADJUSTMENT` txn |
| `upsertAdminCoupon` / `upsertAdminBundle` | Mutation | **ADMIN** |
| `moderateReview` | Mutation | Staff — `PENDING` → `APPROVED`/`REJECTED` |
| `adminAuditLogs` | Query | Staff audit trail (sanitized metadata) |
| `setCustomerActive` | Mutation | **ADMIN** |

### Catalog notes

- Prices are `String` decimals from DB — never accept client prices.
- `availableQuantity` = `onHand − reserved` (display). Checkout **reserves** on PaymentIntent create and **commits** on webhook `PAID`.
- Public list/detail ignore `DRAFT` / `ARCHIVED`.
- Shared Zod: `@vorqen/types` (`productListInputSchema`, `slugSchema`, …).

### Compatibility notes

- `checkCompatibility` reloads typed specs from DB — never trust client `compatible`.
- Shared Zod: `@vorqen/types` (`checkCompatibilityInputSchema`, …).
- Power constants: `PLATFORM_OVERHEAD_WATTS` (50), `PSU_SAFETY_MARGIN_RATIO` (0.2).
- Contract: [`compatibility-engine.md`](./compatibility-engine.md).

### Builder notes

- `previewBuild` is the live authority for totals + compatibility on `/build`.
- Save still re-resolves ACTIVE variants and re-runs compatibility; incompatible builds may be saved for iteration.
- FPS comes only from `benchmarks` rows — never invented client-side.
- Contract: [`pc-builder.md`](./pc-builder.md).

### Storefront notes

- Shop/PDP prices and stock come from catalog services / GraphQL — never from the client.
- Compare tray IDs are UI-only; `compareProducts` reloads ACTIVE products server-side.
- Reviews list APPROVED only; `createReview` always starts as PENDING (moderation in Phase 13).
- Shared Zod: `@vorqen/types` (`createAddressInputSchema`, `createReviewInputSchema`, `compareProductsInputSchema`, …).
- Middleware guards `/account/*` and `/checkout*` (access JWT) in addition to `/admin/*`.

### Checkout notes

- `createCheckoutSession` recalculates cart totals from ACTIVE variants, snapshots shipping + line items, then creates a Stripe **PaymentIntent** for **that** `grandTotal`. Returns `clientSecret` (never a Checkout URL).
- Clients never send prices, paid flags, or payment intent amounts.
- `POST /api/webhooks/stripe` verifies `Stripe-Signature`, then Zod-parses the PaymentIntent. Amount + currency must match the order or payment is `FAILED`.
- `checkoutStatus` is display-only. `/checkout/success` shows **processing** until `orderStatus === PAID`.
- Shared Zod: `@vorqen/types` (`createCheckoutInputSchema`, `decidePaidTransition`, `toStripeAmountCents`, …).

### Orders & inventory notes

- `createCheckoutSession` writes `InventoryTransaction` `RESERVE` (increases `quantityReserved`). Failed PI create or `cancelPendingOrder` writes `RELEASE`.
- Webhook `payment_intent.succeeded` marks the order `PAID` and writes `SALE` in the **same** Prisma transaction. Commit is skipped if the order is no longer `PENDING_PAYMENT` (e.g. customer already cancelled).
- Inventory math is pure (`applyReserve` / `applyCommit` / `applyRelease` in `@vorqen/types`). Clients never send on-hand, reserved, or paid flags.
- `myOrders` / `order` return only rows owned by the authenticated user. Customers cannot set `SHIPPED` / `DELIVERED` (admin, Phase 13).
- Shared Zod: `@vorqen/types` (`orderListInputSchema`, `orderIdInputSchema`).

### Admin notes

- All `admin*` queries require `requireStaff`. Catalog writes, inventory adjust, coupons, bundles, refunds, and customer activate/deactivate require `requireAdmin`.
- Staff cannot set `PAID`. Refund amounts are validated against remaining captured balance on the server.
- Mutations write `audit_logs` (`action`, `entityType`, `entityId`, actor, IP). Metadata is sanitized (secrets redacted) before persist.
- Staff `adminAuditLogs` + `/admin/audit`. Shared: `@vorqen/types` (`sanitizeAuditMetadata`, `AUDIT_ACTIONS`).
- Shared Zod: `@vorqen/types` (`admin.ts` — transitions, refund remaining, upsert schemas).
- `adminAnalytics` is staff-only. Range `7d` / `30d` / `90d` (UTC). Revenue, AOV, recovery/click rates are computed on the server — the client only sends the range.
- Shared: `@vorqen/types` (`analyticsWindow`, `fillDailySeries`, `averageOrderValue`).

### SEO & rate limits

- Public pages emit Open Graph + canonicals. PDPs add Product JSON-LD with **server** price/stock.
- `GET /sitemap.xml` lists `/`, `/shop`, `/build`, `/compare`, and ACTIVE product URLs. `GET /robots.txt` disallows `/admin`, `/account`, `/checkout`, `/api`.
- GraphQL rate limits are in-process sliding windows (no Redis): auth 8/15m, checkout 10/min, mutations 40/min, queries 90/min, plus 180 HTTP req/min per IP. Exceeding returns `RATE_LIMITED` (HTTP 429 when possible).
- Production disables GraphQL introspection. Security headers (CSP, frame deny, nosniff, HSTS in prod) are set in `next.config.ts`.

### Email & abandoned cart

- Resend sends verify, password reset, order-paid, and abandoned-cart mail. Missing `RESEND_API_KEY` skips send (non-prod still logs auth links).
- `POST/GET /api/cron/abandoned-cart` requires `Authorization: Bearer ${CRON_SECRET}` (secret ≥ 16 chars). Signed-in carts only.
- Click `GET /api/email/abandoned/[id]` is a cuid; invalid IDs still redirect to `/cart`.
- Paid webhook marks matching abandoned rows `RECOVERED`. Email failures must not fail the webhook.
- Shared: `@vorqen/types` (`decideAbandonedCartAction`, `cronSecretMatches`).

## Layout

```
apps/web/src/server/
  common/          prisma, DomainError, Zod helpers, logger
  auth/            password, jwt, cookies, rbac, auth.service
  catalog/         list/get products, brands, categories, mappers
  hardware/        re-exports typed-spec mappers
  compatibility/   CompatibilityEngine (pure rules + product resolve)
  builder/         PCBuild CRUD + server pricing preview
  performance/     Game list + benchmark FPS estimates
  checkout/        PaymentIntent + webhook paid transition
  orders/          Customer order list/detail + cancel pending; admin fulfillment
  inventory/       Reserve / commit / release / admin ADJUSTMENT
  payments/        Stripe client (PaymentIntent + refunds)
  email/           Resend client + templates
  abandoned-cart/  Cron job + click + recovered
  analytics/       Staff KPIs + UTC series
  admin/           Ops overview counts
  audit/           Audit log writer + staff list
  security/        In-memory rate limit + HTTP headers
  seo/             Site URL + metadata helpers
  graphql/
    yoga.ts        createYoga + validationRules + maskedErrors
    context.ts     { prisma, userId, user, request }
    schema.ts      typeDefs
    format-error.ts
    validation-rules.ts
    resolvers/
    schemas/       Zod arg schemas
  health/
```

## Context

```ts
{
  prisma: PrismaClient;
  userId: string | null;
  user: AuthUser | null;
  cartSessionId: string | null;
  request: Request;
}
```

Auth resolution order: `Authorization: Bearer` → `vorqen_access` cookie.  
Guest cart: `vorqen_cart_session` cookie (merged into user cart when signed in).

## Cookies

| Cookie | TTL | Notes |
|--------|-----|-------|
| `vorqen_access` | 15m | httpOnly, SameSite=Lax, Secure in production |
| `vorqen_refresh` | 7d | Rotated on `refreshAuth`; jti hashed in DB |
| `vorqen_cart_session` | 30d | Guest cart identity; cleared after merge to user |

## Errors

Services throw `DomainError` (or subclasses). Yoga `maskedErrors` maps to:

```json
{
  "errors": [{
    "message": "Safe user-facing message.",
    "extensions": {
      "code": "VALIDATION_FAILED",
      "fields": { "echo": "…" }
    }
  }]
}
```

Codes: see [`error-handling.md`](./error-handling.md) and `@vorqen/types` `ERROR_CODES`.  
UI helper: `apps/web/src/lib/errors.ts` → `getErrorMessage`.

## Auth & RBAC

- JWT access + refresh via `jose`
- `requireUser` / `requireRoles` / `requireAdmin` / `requireStaff` in `src/server/auth/rbac.ts`
- Next.js middleware redirects unauthenticated users away from `/admin/*`, `/account/*`, and `/checkout*`
- After `login`/`register`, the UI honors `?next=` (same-origin). If `next` is absent, **ADMIN** / **SUPPORT** go to `/admin`; customers go to `/`.
- Store chrome (`StoreNavbar` / `StoreFooter`) reads the access cookie and shows **Sign out** (plus **Admin** for staff) instead of **Sign in**.
- Shared Zod schemas: `@vorqen/types` (`registerInputSchema`, `loginInputSchema`, …)

## Trust boundaries

| Client may send | Server must verify |
|-----------------|--------------------|
| Product / variant IDs | Price, stock, active status |
| Build component IDs | Compatibility result |
| Coupon codes | Validity, limits, discount math |
| Payment redirect success | **Stripe webhook** only for paid |
| Role claims | **Never** — role comes from DB / signed access JWT only |

## Status

| Item | State |
|------|-------|
| Yoga foundation + GraphiQL | ✅ Phase 3 |
| Context + Prisma | ✅ Phase 3 |
| Domain errors + Zod | ✅ Phase 3 |
| Depth / complexity limits | ✅ Phase 3 |
| Auth + RBAC GraphQL | ✅ Phase 4 |
| Catalog + hardware GraphQL | ✅ Phase 5 |
| CompatibilityEngine GraphQL | ✅ Phase 6 |
| PC Builder GraphQL + `/build` UI | ✅ Phase 7 |
| Customer storefront (shop/PDP/compare/account) | ✅ Phase 8 |
| 3D system (R3F + R2 URLs) | ✅ Phase 9 |
| Cart + wishlist + coupon hooks | ✅ Phase 10 |
| Stripe PaymentIntent + webhook | ✅ Phase 11 |
| Orders + inventory GraphQL / account history | ✅ Phase 12 |
| Admin panel (ops GraphQL + `/admin`) | ✅ Phase 13 |
| Resend + abandoned-cart cron / click / recovered | ✅ Phase 14 |
| Admin analytics KPIs + charts | ✅ Phase 15 |
