# Compatibility Engine — VORQEN

> Implemented in **Phase 6**. This doc is the contract; do not invent a second engine in the frontend.

## Principles

- Compatibility is calculated **only on the Next.js server** (`src/server/compatibility`).
- Frontend may display results; it must never be the authority.
- Use typed hardware fields from Prisma — not ad-hoc JSON for critical specs.

## Service

`CompatibilityEngine` (domain module: `compatibility/`)

| Module | Role |
|--------|------|
| `engine.ts` | Pure `evaluateCompatibility(build)` — no Prisma |
| `compatibility.service.ts` | Load ACTIVE products by ID → map specs → engine |
| `constants.ts` | Named power / cooler thresholds |

### GraphQL

```graphql
checkCompatibility(input: CheckCompatibilityInput!): CompatibilityResult!
```

Input: `{ components: [{ slot, productId, quantity? }] }`  
Slots `RAM` / `STORAGE` may repeat; other slots are single.

### Output

```ts
{
  compatible: boolean;
  errors: string[];      // hard failures — build should not proceed as-is
  warnings: string[];    // soft issues — user can continue with caution
  recommendations: string[];
  estimatedWattage: number | null;
  recommendedPsuWatts: number | null;
}
```

`compatible === errors.length === 0`. Incomplete builds are not hard errors — missing parts appear as recommendations.

## Required rule pairs

| Pair | Example checks |
|------|----------------|
| CPU ↔ Motherboard | Socket match |
| CPU ↔ Cooler | Socket support; soft TDP rating warning |
| RAM ↔ Motherboard | Memory type, max capacity, slots; speed warning |
| GPU ↔ Case | Length ≤ GPU clearance |
| GPU ↔ PSU | Wattage + safety margin; vendor recommended PSU warning |
| Motherboard ↔ Case | Form factor fit |
| PSU ↔ Case | PSU form factor |
| Storage ↔ Motherboard | M.2 / SATA slot counts |
| Cooler ↔ Case | Height / radiator clearance |

## Power

| Constant | Value | Meaning |
|----------|-------|---------|
| `PLATFORM_OVERHEAD_WATTS` | `50` | MB / fans / misc baseline |
| `PSU_SAFETY_MARGIN_RATIO` | `0.2` | 20% headroom over estimated draw |
| `COOLER_TDP_WARNING_RATIO` | `0.9` | Warn if cooler rating &lt; 90% of CPU TDP |

```
estimatedWattage = CPU TDP + GPU TDP + PLATFORM_OVERHEAD_WATTS
recommendedPsuWatts = ceil(estimatedWattage * (1 + PSU_SAFETY_MARGIN_RATIO))
```

PSU wattage must be ≥ `recommendedPsuWatts` or the engine emits a hard error.

## Shared types

`@vorqen/types` — `checkCompatibilityInputSchema`, `CompatibilityResult`, `COMPONENT_SLOTS`.

## Non-goals

- Do not hard-code rules inside React components.
- Do not return “compatible: true” from the client when the API is unreachable — show error state instead.
- Builder UI / save build is **Phase 7**.

## Tests (Phase 6)

Covered in `compatibility.test.ts`: matching sockets, mismatched RAM type, GPU too long, PSU undersized, cooler socket miss, form-factor / PSU form / M.2 overflow, happy-path full build.
