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

_None yet — project scaffolding only (2026-08-24)._

---

## Investigating

_None._

---

## Fixed

_None._

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
