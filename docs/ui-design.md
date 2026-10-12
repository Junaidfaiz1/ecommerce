# UI Design System — VORQEN

## Brand

- **Name:** VORQEN  
- **Tagline:** Build Beyond Limits.  
- **Feel:** "Instrument" — a hardware laboratory meets a performance-car configurator. Graphite ground, hairline rules, spec readouts in mono, one signal accent.  

**Not:** neon RGB gamer template, glassmorphism / blurred orbs, gradient text, earth-tone vintage, or a flat "simple" catalog.

## Surfaces

Flat panels with 1px hairlines — no blur, glow or gradient washes:

- `.glass-panel` — solid `surface` fill + hairline border (name kept for compatibility)
- `.glass-nav` — full-width sticky bar with bottom hairline
- `.glass-btn` — solid signal-accent CTA with ink label
- `.glass-input` — transparent field, strong hairline, white on focus
- `.media-bed` — hatched photo bed behind catalog images
- `.crop-marks` — corner crop marks on hero / gallery / builder photos
- `.ticks` — ruler tick strip under headers and charts
- `.eyebrow` / `.label-mono` — section index (`01 / CONFIGURATOR`) and mono field labels
- `productGridClass` — product tiles edge to edge, separated by 1px rules

Product tiles, spec readouts and stat strips use the **hairline grid** pattern: `gap-px` over a `bg-border` parent with `bg-background` cells.

## Color tokens

| Token | Value | Usage |
|-------|-------|--------|
| `--background` / `ink` | `#0C0D0F` | Page canvas, label on accent / white buttons |
| `--surface` | `#141619` | Panels, summary column, hover tile |
| `--elevated` | `#1C1F23` | Raised / active nav item |
| `--foreground` / `cream` | `#EEF0F2` | Primary text, secondary solid buttons |
| `--muted` | `#A3A9B1` | Secondary text |
| `--subtle` | `#6E747C` | Indices, captions (non-essential text only) |
| `--border` | `#23262B` | Hairlines |
| `--border-strong` | `#3A3F45` | Outline buttons, inputs |
| `--accent` | `#FF6B2C` | Signal orange — primary CTA, eyebrows, low stock, conflicts |
| `--pass` | `#7FD9A8` | Compatibility pass / complete slot |
| `--sage` | alias of accent | Legacy eyebrow class |

Accent stays **sparse**: one primary CTA per view, section eyebrows, and warnings. Secondary actions are white (`solid`) or outline buttons.

## Typography

| Role | Font |
|------|------|
| Display / headlines | Archivo (variable width; `[font-stretch:112–125%]`, bold–extra-bold, hero uppercase) |
| Body | Instrument Sans |
| Specs / SKUs / prices in lists / labels | JetBrains Mono |

Big expanded headlines are the signature; keep body copy at 15–19px with readable line length.

## Motion

- CSS only: hero fade-up and hover transitions. No parallax, no glow pulses.
- Scroll motion: subtle, not carnival.

## Layout principles

1. First viewport = one composition (brand, one headline, one subline, CTA group, dominant visual).
2. Sections: one job, one headline, short support text.
3. Cards only when they contain interaction; avoid card soup.
4. Admin shares the palette but stays utilitarian — ops rail, metric cards and Recharts; the storefront carries the editorial display type.

## Key surfaces

### Navbar (desktop)

VORQEN · Shop · Build · Compare · Wishlist · Cart · Account · Sign in  
Signed in: Account · Admin (staff) · Sign out. Single store navbar on `/build` (no second site header).

### Homepage sections (story order)

1. Hero — "BUILD BEYOND LIMITS." expanded caps, tick ruler, catalog GPU photo with crop marks + spec readout strip  
2. Proof strip — rule count, slot count, server source of truth  
3. 01 / Configurator — eight-slot spec sheet beside the six server checks (`ConfiguratorTeaser`)  
4. 02 / Featured hardware — hairline product grid  
5. 03 / Performance — server FPS samples as bars, labelled estimates  
6. 04 / Popular GPUs  
7. 05 / Compare CTA  
8. Footer — oversized ghost wordmark  

Not yet built (no backend): featured builds gallery, reviews strip, newsletter.

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

- Excessive neon / rainbow gradients, glassmorphism, blurred color orbs  
- Huge glowing text everywhere  
- Electric violet / cool-blue gamer accents  
- Generic dashboard card grids on marketing pages  
- Overlays/stickers on hero media  

## Implementation notes

- Tokens live in `apps/web/src/app/globals.css`; hex constants in `apps/web/src/theme/palette.ts`.  
- Base rules sit in `@layer base` and the custom classes in `@layer components`, so Tailwind utilities (`border-accent`, `bg-background`, …) always win. Never add unlayered global selectors that set colors.  
- Fonts load via `next/font/google` in `app/layout.tsx` (Archivo with the `wdth` axis, Instrument Sans, JetBrains Mono).  
- shadcn/ui themed to the palette above.  
- Prefer `next/image` for 2D assets; lazy 3D only where needed.
- **Reuse UI** — see [`components.md`](./components.md). Prefer shared components over page-local duplicates.
