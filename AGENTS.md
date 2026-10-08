# VORQEN — Agent Instructions

Portfolio-grade gaming hardware commerce platform.

**Tagline:** Build Beyond Limits.

## Before any work

1. Read [`PROGRESS.md`](./PROGRESS.md) — current phase, done vs remaining, next task.
2. Read relevant docs under [`docs/`](./docs/).
3. Follow rules in [`.cursor/rules/`](./.cursor/rules/).
4. Implement **only the current phase**. Do not jump ahead.
5. Do not overwrite working code without reason.
6. After implementation: typecheck → lint → tests → verify Next.js starts → update `PROGRESS.md`.

## Source of truth

| Topic | File |
|-------|------|
| Current status / next phase | [`PROGRESS.md`](./PROGRESS.md) |
| Feature checklist | [`docs/features.md`](./docs/features.md) |
| Architecture | [`docs/architecture.md`](./docs/architecture.md) |
| Tech stack / versions | [`docs/tech-stack.md`](./docs/tech-stack.md) |
| UI / design system | [`docs/ui-design.md`](./docs/ui-design.md) |
| Reusable components | [`docs/components.md`](./docs/components.md) |
| Error handling | [`docs/error-handling.md`](./docs/error-handling.md) |
| Validation | [`docs/validation.md`](./docs/validation.md) |
| Testing | [`docs/testing.md`](./docs/testing.md) |
| Phases | [`docs/phases.md`](./docs/phases.md) |
| Known bugs | [`docs/bugs.md`](./docs/bugs.md) |

## Hard constraints

- **Next.js only** — no NestJS, no `apps/api`.
- **No Docker** — Postgres via Neon (or native install) + `DATABASE_URL`.
- Modular monolith — **no** Redis, BullMQ, RabbitMQ, Kafka, or microservices.
- Prefer **latest stable** versions of all dependencies (see `docs/tech-stack.md` + `.cursor/rules/latest-versions.mdc`).
- Never trust frontend for: prices, inventory, compatibility, roles, payment state.
- Stripe webhook is the source of truth for payment confirmation.
- Compatibility and cart pricing must run in Next.js **server** modules.
- Phase-gated delivery — Phase 1 before Phase 2, and so on.

## Product identity

Premium hardware laboratory + high-end automotive configurator + modern gaming tech — **not** a neon “gamer RGB” site.

<!-- BEGIN:turborepo-agent-rules -->

# This is NOT the Turborepo you know

Turborepo configuration, task behavior, and CLI commands can vary between installed versions and may differ from your training data. Resolve the `turbo` package from this file's directory or relevant workspace; in monorepos, it may not be visible from the repository root. For example, run `node -p "require.resolve('turbo/package.json')"` from a workspace that depends on `turbo`.

Read `docs/README.md` inside that installed package first, then read the relevant pages from its `docs/` directory before changing Turborepo configuration or commands. Heed deprecation notices. These bundled docs match the installed package version and are available without network access.

This block is written and re-added by `turbo` before repository-scoped commands when an AI agent is detected. In the Turborepo source repository, its template is defined in `crates/turborepo-cli/src/cli/agent_guidance.rs`. Removing the managed block while updates are enabled means a later qualifying invocation will add it again. Set `"agentGuidance": false` in the root `turbo.json` or `turbo.jsonc` to opt out; this does not remove an existing block. Keep the block committed with your work to avoid an uncommitted change on the next agent invocation.
<!-- END:turborepo-agent-rules -->
