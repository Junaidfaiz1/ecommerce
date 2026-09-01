# Bugs & Issues — VORQEN

> Living bug tracker for agents and humans.  
> Prefer GitHub Issues later; keep this file in sync for Cursor context.

## Status values

`open` · `investigating` · `fixed` · `wontfix` · `duplicate`

## Severity

| Level | Meaning |
|-------|---------|
| P0 | Blocker — app won't run / data loss / payment broken |
| P1 | Major — core flow broken (builder, checkout, auth) |
| P2 | Medium — degraded UX or non-critical feature |
| P3 | Minor — polish, copy, edge case |

## Template (copy for new bugs)

```markdown
### BUG-XXX — short title
- **Status:** open
- **Severity:** P2
- **Phase / area:** e.g. Phase 7 / builder
- **Repro:** steps…
- **Expected:** …
- **Actual:** …
- **Notes:** …
```

---

## Open

_None._

---

## Investigating

_None._

---

## Fixed

### BUG-003 — Signed-in chrome still showed Sign in; staff not sent to `/admin`; duplicate `/build` navbar
- **Status:** fixed
- **Severity:** P2
- **Phase / area:** storefront / auth / builder
- **Repro:** Sign in; stay on storefront. Sign in as `admin@vorqen.local` from `/login`. Open `/build`.
- **Expected:** Navbar shows Sign out (Admin for staff); staff land on `/admin`; one site navbar on builder
- **Actual:** Sign in CTA stayed; home redirect for admin; second glass header on `/build`
- **Notes:** `getNavSession` + `postAuthPath`; builder page-local header removed.

### BUG-002 — Catalog product images did not load
- **Status:** fixed
- **Severity:** P1
- **Phase / area:** storefront / catalog
- **Repro:** Open `/` or `/shop` after seed
- **Expected:** Product cards show a photo
- **Actual:** Seed stored `https://placeholder.vorqen.local/…` which does not resolve
- **Notes:** Shared local asset `/assets/catalog/product.jpg`; mapper rewrites the fake host. Re-seed optional.

### BUG-001 — Next.js did not load repo-root `DATABASE_URL`
- **Status:** fixed
- **Severity:** P0
- **Phase / area:** local run / Prisma
- **Repro:** `.env` at repo root; `pnpm dev` from monorepo; open `/`
- **Expected:** Prisma connects with root `DATABASE_URL`
- **Actual:** `DATABASE_URL is not set` from `apps/web/src/server/common/prisma.ts`
- **Notes:** Next.js only auto-loads `apps/web/.env`. `loadRootEnv()` now loads the repo-root file from `next.config.ts` and Prisma. Restart `pnpm dev` after changing `.env`.

---

## Known limitations (by design)

| Item | Notes |
|------|-------|
| No Redis/queues | Abandoned cart uses Postgres + Next.js cron Route Handlers |
| Demo 3D/images | Procedural demo chassis labeled in UI until licensed GLBs are uploaded to R2 |
| Performance estimates | Labeled estimates from benchmark data — not live benchmarks |

---

## Agent rules for bugs

1. When you discover a bug while implementing, **add it here** before ignoring it.
2. If you fix a bug, move it to **Fixed** with date and PR/commit note if available.
3. Do not close P0/P1 as “later” without recording them.
4. Security issues: fix or escalate immediately; never log secrets in this file.
