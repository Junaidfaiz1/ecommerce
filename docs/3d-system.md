# 3D System — VORQEN

> Implemented in **Phase 9**. Assets via Cloudflare R2 (public CDN URLs from the server).

## Stack

- Three.js `^0.185`
- React Three Fiber `^9.7`
- `@react-three/drei` `^10.7`

## Experiences

| Experience | Location | Notes |
|------------|----------|--------|
| A. Hero PC | Homepage | Interactive demo chassis; explode / spin / fullscreen |
| B. Builder PC | `/build` | Reflect filled slots; highlight active step |
| C. Product viewer | PDP | Procedural part by type, or GLB when `product_3d_assets` row exists |

## Features

- Rotate, zoom (OrbitControls; pan disabled)
- Auto-rotate (togglable)
- Component highlighting (builder step)
- Exploded view with smooth animation (CASE, MB, CPU, cooler, GPU, RAM, storage, PSU)
- Fullscreen
- Lazy canvas via `next/dynamic` (`ssr: false`) — never on checkout
- GLB + Draco via drei `useGLTF(url, true)`; procedural fallback for demo / failed loads

## Server modules

| Module | Role |
|--------|------|
| `server/storage` | R2 config, object keys, public URL resolution, put/delete |
| `server/three-d-assets` | List / viewer asset for ACTIVE products; procedural sentinel when none |

## GraphQL

- `product3DAssets(productId \| productSlug)` → `[Product3DAsset!]!`
- `productViewerAsset(productId \| productSlug)` → preferred asset or `procedural://{kind}` fallback

## Asset URLs

- `https://…` — load GLB (Draco-capable)
- `procedural://pc` / `procedural://gpu` / … — client procedural meshes (labeled **Demo**)
- Object keys — resolved with `R2_PUBLIC_URL` when set

## Storage paths (R2)

```
products/{productId}/images/
products/{productId}/thumbnails/
products/{productId}/3d/
```

Signed or public URLs via backend storage abstraction — **no R2 secrets in the browser**.

## Performance rules

- Dynamic-import 3D canvases only on hero / builder / PDP.
- Do not load catalog-wide 3D on list pages.
- Placeholder/demo assets until licensed GLBs exist (label clearly).
- **Phase 18 budgets** (`resolveThreeDBudget` in `@vorqen/types`):
  - Cap DPR at 1.5 (1.25 on mobile / Save-Data / reduced motion).
  - Pause `frameloop` when the canvas is off-screen or the tab is hidden.
  - Skip HDRI `Environment` and contact shadows on constrained devices.
  - Shadow maps 512 (256 constrained); cooler cylinders 12 / 8 segments.
  - `powerPreference: low-power` + no antialias when constrained.
