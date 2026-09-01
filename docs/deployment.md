# Deployment — VORQEN

> Fill in during **Phase 19**. Skeleton only.

## Targets

| Piece | Platform |
|-------|----------|
| `apps/web` | Vercel (UI + API routes) |
| Database | Neon (or equivalent Postgres) — **no Docker** |
| Assets | Cloudflare R2 |
| CI | GitHub Actions |

## Checklist (Phase 19)

- [ ] Production env vars set (see `docs/tech-stack.md`)
- [ ] Migrations run against prod DB
- [ ] Stripe webhook endpoint + secret
- [ ] R2 bucket + public/signed URL strategy
- [ ] Resend domain + from-address
- [ ] Sentry DSN
- [ ] CI: lint, typecheck, test on PR
- [ ] README deployment section updated

## Notes

Document actual hosts, URLs, and runbooks here when deploying — do not invent unfinished infra details earlier.
