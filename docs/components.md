# Reusable Components — VORQEN

> Agents must **prefer reuse** over new one-off UI. Extend existing pieces before creating duplicates.

## Goals

- Consistent premium look across store, builder, account, and admin (admin may theme differently but still share primitives).
- Faster feature work (Phase 8+) without redesigning buttons, cards, and forms each time.
- Single place to fix accessibility, loading, and empty states.

## Folder map

```
apps/web/
  components/
    ui/           # shadcn primitives — Button, Input, Dialog, Sheet, Tabs…
    layout/       # Shell, Footer, Section, Container
    navigation/   # Navbar, MegaMenu, MobileDrawer, Breadcrumbs
    shared/       # Cross-feature: ProductCard, Price, Rating, StockBadge…
    3d/           # Canvas wrappers, Hotspot, ExplodeControls (lazy-loaded)
  features/
    <domain>/
      components/ # Only domain-specific UI (e.g. BuilderStepNav)
packages/
  ui/             # Truly shared package exports (optional promotion from apps/web)
```

## Promotion rule

1. First use → `features/<domain>/components/`
2. Second feature needs it → move/refactor to `components/shared/`
3. Used by web + another app/package → `packages/ui`

## Must-be-shared (build these as reusable, not page-local)

| Component | Used by |
|-----------|---------|
| `Button`, form controls | Everywhere |
| `ProductCard` | Shop, search, wishlist, bundles, admin previews |
| `Price` / `PriceRange` | Cards, PDP, cart, builder summary |
| `RatingStars` | Cards, PDP, reviews (read) + write-review picker (`onChange`) |
| `StockBadge` | Cards, PDP, admin inventory |
| `QuantityStepper` | Cart, checkout, PDP |
| `EmptyState` / `ErrorState` | Lists, builder, account |
| `Skeleton` family (`components/shared/Skeleton.tsx`) | All loading states — see below |
| `SectionHeader` | Marketing + store sections |
| `CompareToggle` / `WishlistToggle` | Cards, PDP |
| `AddToCartButton` / `QuantityStepper` | Cards, PDP, cart |
| `CatalogImage` | ProductCard, PDP, cart, wishlist, hero, builder viewport, compare, **admin catalog** (`next/image`) |
| `StoreNavbar` / `SignOutButton` | Store + account chrome; session from access cookie |
| `HeroHardwareMedia` | Homepage hero catalog photos |
| `JsonLd` | Homepage, PDP structured data |
| `ConfiguratorTeaser` / `PerformanceShowcase` / `HeroHardwareMedia` | Homepage (`features/storefront`) |

## Loading skeletons

No "Loading…" text on data surfaces — render a skeleton shaped like the content.

| Skeleton | Use for |
|----------|---------|
| `Skeleton` / `SkeletonText` | Primitive blocks (`.skeleton` sweep, reduced-motion safe) |
| `SkeletonRegion` | Wrap a group: one `role="status"` + sr-only label |
| `ProductGridSkeleton` / `ProductCardSkeleton` | Home grids, shop results |
| `MediaListSkeleton` / `CommercePageSkeleton` | Cart, checkout, wishlist, builder options |
| `ListSkeleton` | Orders, builds, addresses |
| `FormSkeleton` | Account profile, auth forms, admin product edit |
| `SummarySkeleton` / `OrderDetailSkeleton` | Order + checkout summaries (account and admin) |
| `TableSkeleton` / `DashboardSkeleton` | Admin lists, admin overview |
| `ProductDetailSkeleton`, `BuilderSkeleton`, `PerformanceShowcaseSkeleton` | Feature-specific page frames |

Patterns:

- **Route level:** `loading.tsx` in `(store)`, `shop`, product routes, `compare`, `account`, `admin`.
- **Server sections:** stream with `<Suspense fallback={…Skeleton}>`; key the boundary by the filters (shop results) so every search shows the skeleton again.
- **Client fetches:** derive `loading` from a request key (`loadedKey !== requestKey`) so refetches on filter/search change show the skeleton; debounce typed queries with `useDebouncedValue` (`src/hooks`).
- `productGridClass` lives in `components/shared/product-grid.ts` — never export plain constants from a `'use client'` file for server components.

## API guidelines

- Prefer clear props over children soup when the structure is fixed.
- Use `variant` / `size` / `className` (cn helper) for styling escapes.
- Keep components presentational when possible; data fetching stays in page/feature containers or RSC.
- Client components only if the reusable piece needs interaction/browser APIs.

## Checklist before adding a new component

1. Search `components/` and `features/*/components/` for an existing match.
2. Can an existing component gain a prop/variant instead?
3. If new: name it generically (`ProductCard`, not `HomeFeaturedGpuCard`).
4. Document non-obvious props in a short file-top comment only when needed.
5. Wire loading/empty/error through shared state components when applicable.

## Related

- Design tokens: [`ui-design.md`](./ui-design.md)
- Frontend structure: [`architecture.md`](./architecture.md)
- Cursor rule: `.cursor/rules/reusable-components.mdc`
