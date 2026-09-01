# PC Builder — VORQEN

> Primary differentiator. **Phase 7 complete.** Depends on Compatibility (Phase 6) and Catalog (Phase 5).

## Route

`/build`

Query params:

| Param | Effect |
|-------|--------|
| `?id=` | Reopen saved build by id |
| `?slug=` | Open public/unlisted build by slug |
| `?duplicate=1` | With `id`/`slug` — duplicate into the signed-in user’s private builds |

## Steps

1. CPU  
2. GPU  
3. Motherboard  
4. RAM  
5. Storage  
6. PSU  
7. Case  
8. Cooling  
9. Review  

## Capabilities

| Capability | Status |
|------------|--------|
| Selected component summary | ✅ |
| Live price (from **backend** `previewBuild`) | ✅ |
| Compatibility status / errors / warnings / recommendations | ✅ |
| Estimated performance (benchmark-based; labeled as estimate) | ✅ |
| Estimated power + recommended PSU (via compatibility result) | ✅ |
| Save / reopen / duplicate builds | ✅ |
| Add entire build to cart | ✅ Phase 10 (`addBuildToCart`) |
| Interactive 3D PC | ✅ Phase 9 (procedural demo chassis + R2 GLB path) |

## Layout

| Viewport | Layout |
|----------|--------|
| Desktop | Left: component nav · Center: viewport + picker · Right: build summary |
| Mobile | Horizontal step strip + single column |

## State

- Zustand (`features/builder/store`) holds **draft selection** for UX only.
- Persist and validate through GraphQL (`PCBuild` / items).
- Always re-run compatibility on the server via `previewBuild` / `saveBuild`.

## GraphQL

| Field | Notes |
|-------|-------|
| `previewBuild(input)` | Server prices + `CompatibilityResult` |
| `myBuilds` | Auth — list owned builds |
| `build(id \| slug)` | Visibility-aware load |
| `saveBuild` / `duplicateBuild` / `deleteBuild` | Auth mutations |
| `games` / `estimatePerformance` | Benchmark FPS samples |

Shared Zod: `@vorqen/types` (`previewBuildInputSchema`, `saveBuildInputSchema`, `estimatePerformanceInputSchema`, …).

## Related

- [`compatibility-engine.md`](./compatibility-engine.md)
- [`3d-system.md`](./3d-system.md)
- [`ui-design.md`](./ui-design.md)
- [`api.md`](./api.md)
