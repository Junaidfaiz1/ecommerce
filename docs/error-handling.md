# Error Handling — VORQEN

## Principles

1. Services throw typed domain errors; transports only map them.
2. Clients receive **stable codes** + safe messages — never stack traces or DB errors.
3. Frontend maps codes → copy; unknown codes → generic message.
4. Log full detail server-side; show minimal detail client-side.

## Suggested error codes

| Code | HTTP-ish meaning | When |
|------|------------------|------|
| `UNAUTHENTICATED` | 401 | Missing/invalid token |
| `FORBIDDEN` | 403 | RBAC denial |
| `NOT_FOUND` | 404 | Entity missing |
| `VALIDATION_FAILED` | 400 | Schema / field errors |
| `CONFLICT` | 409 | Duplicate / version conflict |
| `INSUFFICIENT_STOCK` | 409 | Inventory |
| `INVALID_COUPON` | 400 | Coupon rules |
| `INCOMPATIBLE_BUILD` | 400 | Hard compatibility errors on add-to-cart/save |
| `PAYMENT_REQUIRED` / `PAYMENT_FAILED` | 402/400 | Checkout |
| `RATE_LIMITED` | 429 | Throttle |
| `INTERNAL` | 500 | Unexpected |

Extend when adding domain codes; keep this table and `@vorqen/types` `ERROR_CODES` aligned.

## GraphQL shape

```json
{
  "errors": [{
    "message": "Not enough stock for this variant.",
    "extensions": {
      "code": "INSUFFICIENT_STOCK",
      "fields": { "variantId": "..." }
    }
  }]
}
```

`message` must be safe for users. Field errors go under `extensions.fields` when useful.

Implementation (Phase 3):

- Services throw `DomainError` from `src/server/common/errors.ts` (`RateLimitedError` → `RATE_LIMITED`)
- Yoga `maskedErrors.maskError` → `format-error.ts`
- Unexpected errors → `INTERNAL` (dev may show original message)
- GraphQL rate limiter (Phase 16) returns `RATE_LIMITED` with `retryAfter` seconds; HTTP 429 when the plugin short-circuits

## Frontend mapping

- Central helper: `getErrorMessage` / `getErrorFields` in `apps/web/src/lib/errors.ts`
- Inline for forms; toast for page-level mutations; full `ErrorState` for failed queries
- Builder: show compatibility `errors[]` / `warnings[]` from API payload (not the same as transport errors)

## Payments

- Success UI only after webhook-confirmed order state (or explicit “processing” while pending).
- If redirect returns but webhook pending → “Payment processing” — do not invent “Paid”.

## Related

- Validation: [`validation.md`](./validation.md)
- Bugs: [`bugs.md`](./bugs.md)
