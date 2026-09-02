# UI Design System — VORQEN

## Brand

- **Name:** VORQEN  
- **Tagline:** Build Beyond Limits.  
- **Feel:** Night laboratory glass — deep navy canvas, frost panels, cyan + magenta light.  

**Not:** neon RGB gamer template, earth-tone vintage, or a flat “simple” catalog.

## Surfaces

Storefront and auth use **frosted glassmorphism** over drifting color orbs:

- `.glass-panel` — cards, filters, PDP buy column
- `.glass-nav` — floating pill navbar
- `.hero-stage` — rounded homepage hero
- `.glass-btn` — orange→magenta gradient CTAs
- `.glass-input` — translucent fields

Auth uses a two-column shell (`AuthShell`): brand story + glass form.

## Color tokens

| Token | Value | Usage |
|-------|-------|--------|
| `--background` | `#08091A` | Page canvas |
| `--surface` | `#12162C` | Solid fallback panels |
| `--elevated` | `#1B2140` | Admin rail / raised |
| `--foreground` / cream | `#F4F7FF` | Primary text |
| `--muted` | `#B8C0E0` | Secondary text |
| `--border` | `white / 16%` | Hairline glass edges |
| `--accent` | `#FF5C8A` | Magenta highlight / CTA |
| `--ink` | `#08091A` | Dark fill, 3D studio |
| `--cream` | `#F4F7FF` | Text on dark |
| `--sage` | `#7AE0FF` | Cyan glow, eyebrows |

Accent stays **sparse** — status, primary CTA, focus rings.

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

## Layout principles

1. First viewport = one composition (brand, one headline, one subline, CTA group, dominant visual).
2. Sections: one job, one headline, short support text.
3. Cards only when they contain interaction; avoid card soup.
4. Admin ≠ storefront. Admin uses a navy ops rail, rounded metric cards, and Recharts (area / donut / funnel); the storefront is night glass with orbs.

## Key surfaces

### Navbar (desktop)

VORQEN · Shop · Build · Compare · Wishlist · Cart · Account · Sign in  
Signed in: Account · Admin (staff) · Sign out. Single store navbar on `/build` (no second site header).

### Homepage sections (story order)

1. Hero — BUILD BEYOND LIMITS. + catalog hardware photos  
2. How it works — choose parts → server checks → checkout  
3. Featured hardware  
4. Build Your Machine  
5. Popular GPUs  
6. Performance showcase — server FPS samples, labeled estimates  
7. Hardware comparison  
8. Featured builds  
9. Gaming setup  
10. Latest hardware  
11. Reviews  
12. Newsletter  
13. Footer  

### PC Builder

- Desktop: left component nav | center part photos | right summary  
- Mobile: step-by-step  

### Product card

Image, name, category, price, rating, key spec, stock; actions: cart, build, compare, wishlist; subtle hover.

### Product detail

Photo gallery as focal point + specs, compatibility, performance, reviews.

### Checkout

Distraction-free steps: Customer → Shipping → Payment → Review. **No** heavy 3D.

## Responsive strategy

| Breakpoint | Approach |
|------------|----------|
| Desktop | Mega nav, 3-col builder |
| Tablet | Two-column |
| Mobile | Single column, step builder, sticky cart CTA |

Do not merely shrink desktop layouts.

## Avoid list

- Excessive neon / rainbow gradients  
- Huge glowing text everywhere  
- Electric violet / cool-blue gamer accents  
- Generic dashboard card grids on marketing pages  
- Overlays/stickers on hero media  

## Implementation notes

- Tokens live in `apps/web/src/app/globals.css`; hex constants in `apps/web/src/theme/palette.ts`.  
- shadcn/ui themed to the palette above.  
- Prefer `next/image` for 2D assets; lazy 3D only where needed.
- **Reuse UI** — see [`components.md`](./components.md). Prefer shared components over page-local duplicates.
