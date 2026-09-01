# Testing — VORQEN

## Commands

```bash
pnpm test          # unit + service integration + in-process critical path
pnpm test:e2e      # builder→paid path + optional HTTP smoke
```

HTTP UI smoke is skipped unless `E2E_BASE_URL` points at a running Next.js origin (`pnpm dev`).

## Priority targets

| Area | Type | Coverage |
|------|------|----------|
| CompatibilityEngine rules | Unit | `compatibility.test.ts` |
| Cart pricing + coupons | Unit / integration | `cart.test.ts`, `cart.integration.test.ts` |
| Inventory reserve / commit / release | Unit / integration | `inventory.test.ts`, `inventory.integration.test.ts` |
| Admin order transitions + refund remaining | Unit | `admin.test.ts` |
| Stripe webhook signature + order paid | Unit / integration | `checkout.test.ts`, `checkout.integration.test.ts` |
| Auth + RBAC guards | Unit / integration | `auth.test.ts`, `auth.integration.test.ts` |
| GraphQL client authority (no paid/price/stock from client) | Integration | `authority.test.ts` |
| Abandoned cart scheduler | Unit / integration | `email.test.ts`, `abandoned-cart.integration.test.ts` |
| Order creation / ownership | Integration | `orders.integration.test.ts` |
| Builder save → add to cart → checkout → paid | In-process E2E | `critical-path.e2e.test.ts` |
| Public route / checkout auth smoke | HTTP E2E (opt-in) | `e2e-ui.smoke.test.ts` |
| 3D budgets + catalog list include + image optimizer allowlist | Unit | `perf.test.ts` |

## Conventions

- Name tests after behavior: `rejects GPU longer than case clearance`.
- Use `apps/web/src/server/test/fixtures.ts` — not production secrets.
- Deterministic time in scheduler tests (inject `now`).
- Do not assert on full raw HTML for core logic.
- Integration tests use an in-memory Prisma stand-in (`createMemoryPrisma`). They do not require `DATABASE_URL`.
- Stripe PaymentIntent create is stubbed via `stripeTestHooks`; webhook processing still runs `handleStripeWebhookEvent`.
- Do not assert on leaked internal error strings.

Abandoned-cart scheduler tests inject `now` (`decideAbandonedCartAction` in `@vorqen/types`; `apps/web/src/server/email/email.test.ts` and `abandoned-cart.integration.test.ts`).
Analytics window/series/AOV tests inject `now` (`apps/web/src/server/analytics/analytics.test.ts`).
Rate-limit window, audit sanitization, and JSON-LD tests: `apps/web/src/server/security/security.test.ts`.

## Related

- Features: [`features.md`](./features.md) (F-122)
- Phases: [`phases.md`](./phases.md) Phase 17
