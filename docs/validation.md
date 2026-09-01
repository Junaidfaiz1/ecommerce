# Validation — VORQEN

## Dual validation

| Layer | Tool | Role |
|-------|------|------|
| Web forms | Zod + React Hook Form | Fast UX feedback |
| API / server | Zod in `src/server` + GraphQL resolvers | **Source of truth** |
| Shared | `packages/types` (Zod schemas / DTOs) | Single shape when both sides need it |

If client and server schemas drift, **server wins**. Fix the shared schema.

## What to validate

- Auth: email format, password policy, token presence  
- Catalog inputs: slugs, enums, positive prices (admin)  
- Cart: variant IDs, quantities (positive ints, max caps)  
- Coupons: code format, then **business** rules in service  
- Builder: component IDs + types; compatibility is separate engine  
- Addresses: required fields, country/postal rules as modeled  
- Uploads: mime/size via storage service before R2 put  
- Webhooks: signature first, then payload schema
- Cron: `Authorization: Bearer ${CRON_SECRET}` (secret ≥ 16 chars); abandoned-cart click IDs are cuids only  

## Never accept from client as truth

- Final line price / tax / shipping total  
- Stock count  
- `compatible: true`  
- `role: ADMIN`  
- `paymentStatus: PAID`  

Clients send identifiers and intent; server computes outcomes.

## Money & quantities

- Store money as integer minor units (e.g. cents) or Prisma `Decimal` — pick one in Phase 2 and stay consistent.
- Quantities: integers ≥ 1 (or 0 only where cart removal is modeled separately).

## GraphQL

- Validate all args.
- Reject over-deep queries (Phase 3 / 16).
- Paginate lists — no unbounded “return all products”.

## Related

- Errors: [`error-handling.md`](./error-handling.md)
- Security: `.cursor/rules/security.mdc`
