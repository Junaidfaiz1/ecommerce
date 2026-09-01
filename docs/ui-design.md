# UI Design System — VORQEN

## Brand

- **Name:** VORQEN  
- **Tagline:** Build Beyond Limits.  
- **Feel:** Premium hardware laboratory + automotive configurator + modern gaming tech  

**Not:** neon RGB gamer template, excessive glow, cheap glassmorphism.

## Color tokens

| Token | Value | Usage |
|-------|-------|--------|
| `--bg` | `#070707` | Page background |
| `--surface` | `#101010` | Panels |
| `--elevated` | `#171717` | Raised surfaces |
| `--text` | `#F5F5F5` | Primary text |
| `--muted` | `#8A8A8A` | Secondary text |
| `--border` | `#252525` | Borders / dividers |
| `--accent` | Electric violet / cool blue | Sparse CTAs, focus, key highlights |

Accent must be **rare** — status, primary CTA, focus rings — not wallpaper.

## Typography

| Role | Font |
|------|------|
| Display / headlines | Space Grotesk |
| Body | Geist or Inter |
| Specs / SKUs / technical | JetBrains Mono |

Large editorial type is encouraged; keep contrast and line-length readable.

## Motion

- Purposeful Framer Motion (2–3 intentional motions on marketing surfaces).
- Scroll motion: subtle, not carnival.
- 3D camera / explode transitions: smooth, performant.

## Layout principles

1. First viewport = one composition (brand, one headline, one subline, CTA group, dominant visual).
2. Sections: one job, one headline, short support text.
3. Cards only when they contain interaction; avoid card soup.
4. Admin ≠ storefront. Admin is a dense, professional ops UI.

## Key surfaces

### Navbar (desktop)

VORQEN · Shop · Build · Compare · Performance · Showroom · Search · Wishlist · Cart · Account  
Mega menus for Shop.

### Homepage sections (story order)

1. Hero — BUILD BEYOND LIMITS. + 3D PC  
2. Featured hardware  
3. Build Your Machine  
4. Interactive 3D PC  
5. Popular GPUs  
6. Performance showcase  
7. Hardware comparison  
8. Featured builds  
9. Gaming setup  
10. Latest hardware  
11. Reviews  
12. Newsletter  
13. Footer  

### PC Builder

- Desktop: left component nav | center 3D | right summary  
- Mobile: step-by-step  

### Product card

Image, name, category, price, rating, key spec, stock; actions: cart, build, compare, wishlist; subtle hover.

### Product detail

3D viewer as focal point + gallery, specs, compatibility, performance, reviews.

### Checkout

Distraction-free steps: Customer → Shipping → Payment → Review. **No** heavy 3D.

## Responsive strategy

| Breakpoint | Approach |
|------------|----------|
| Desktop | Full 3D, mega nav, 3-col builder |
| Tablet | Two-column |
| Mobile | Single column, step builder, simplified 3D, sticky cart CTA |

Do not merely shrink desktop layouts.

## Avoid list

- Excessive neon / rainbow gradients  
- Huge glowing text everywhere  
- Purple-on-white / cream-serif AI clichés  
- Generic dashboard card grids on marketing pages  
- Overlays/stickers on hero media  

## Implementation notes

- Define CSS variables early (Phase 1 / 8).  
- shadcn/ui themed to the palette above.  
- Prefer `next/image` for 2D assets; lazy 3D only where needed.
- **Reuse UI** — see [`components.md`](./components.md). Prefer shared components over page-local duplicates.
