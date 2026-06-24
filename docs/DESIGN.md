# Design Guidelines — Murtaza & Sarrah Wedding Site

This is the visual language for all guest-facing (public) UI. Follow it when building or restyling any component. The admin area is exempt (it has its own plain utilitarian style) but may adopt these tokens over time.

## 1. Direction

**Elegant wedding stationery.** A formal ivory, champagne, dusty rose, antique gold, and ink-blue palette with a rosewood accent: luminous paper surfaces, restrained metallic warmth, refined serif typography, rounded stationery shapes that tilt slightly off-axis, and gentle motion. Think hand-lettered invitation suite, wax seals, envelope liners, and candlelit gold; never a children's party.

- Elegance comes from: generous whitespace, letterspaced uppercase labels, the display serif, soft shadows, ivory surfaces, deep ink blue, champagne gold, dusty rose, and restrained rosewood accents.
- Warmth comes from: slight rotations (±1–2°), italic flourishes, low-contrast paper washes, tiny metallic flecks, and subtle hover micro-interactions (straighten, lift, tilt).
- Never: harsh borders, pure black, neon color, candy pastels, saturated party blue, bright orange, confetti-heavy decoration, sharp corners on interactive elements, purple gradients, generic fonts.

## 2. The three-day color story

The wedding spans three days (Oct 20–22, 2026), each with its own restrained stationery pairing. Day-specific UI must use its day's pair; general UI may mix freely from the full wedding set.

| Day | Date | Theme | Pale (backgrounds) | Deep (text/accents) |
|---|---|---|---|---|
| Day 1 — celebrations begin | Tue, Oct 20 | dusty rose + champagne | `blush`, `peach` | `rose`, `tangerine` |
| Day 2 — the farmhouse | Wed, Oct 21 | vellum + ink blue | `powder`, `sky` | `bluebell`, `deepblue` |
| Day 3 — the main event | Thu, Oct 22 | ivory + antique gold | `warm-white`, `peach` | `deepblue`, `tangerine` |

## 3. Color tokens

All tokens are defined in `app/globals.css` (`:root` + `@theme inline`) and available as Tailwind v4 utilities (`bg-blush`, `text-rose`, `border-bluebell/30`, …). Never hardcode hex values in components — add a token first if one is missing.

Wedding stationery palette:

| Token | Hex | Role |
|---|---|---|
| `blush` | `#f0dcd4` | dusty rose paper wash |
| `rose` | `#8f3f48` | rosewood wax-seal accent, flourishes, active states, links |
| `mint` | `#e9e3d8` | linen wash, kept under the legacy token name |
| `leaf` | `#6f634d` | aged olive-gold ink |
| `sky` | `#e5ebef` | muted blue-grey envelope lining |
| `bluebell` | `#344f73` | formal ink-blue accent |
| `peach` | `#ead7b7` | champagne gold wash |
| `tangerine` | `#9d7443` | antique gold accent text |
| `powder` | `#f3eee7` | vellum paper surface |
| `deepblue` | `#223f63` | primary CTA color, formal ink accent |

Neutrals:

| Token | Hex | Role |
|---|---|---|
| `background` | `#f8f1e6` | luminous ivory page background |
| `warm-white` | `#fffaf3` | card/nav surfaces, text on dark fills |
| `foreground` | `#223149` | deep ink headings and primary text; never black |
| `text-secondary` | `#6b625b` | warm grey body copy, labels, captions |
| `border` | `#e5cfaa` | soft champagne border for legacy shared controls |
| `muted` | `#a98a5a` | muted gold placeholder/caption color |

Pairing rule: pale surfaces take their matching deep accent for text (`bg-blush` -> `text-rose`, `bg-mint` -> `text-leaf`, `bg-sky` -> `text-bluebell`, `bg-peach` -> `text-tangerine`, `bg-powder` -> `text-deepblue`). Deep accents are for large/short text and labels only; long body copy stays `text-foreground` / `text-text-secondary`.

Legacy earth tokens (`accent`, `sage`, `cream`, …) still exist for not-yet-redesigned pages; do not use them in new work.

## 4. Typography

Two fonts, loaded via `next/font/google` in `app/layout.tsx` and exposed as `font-display` and `font-body`:

- **Bodoni Moda** (`font-display`) — high-contrast editorial serif for names, headings, big numerals, italic flourishes. Use it large and with restraint so the site feels like a designed wedding invitation rather than a generic landing page.
  - Add the `.display-wonk` class (defined in `globals.css`) on hero-scale headings and decorative numerals to tighten the editorial letter spacing. Use it at large sizes only.
  - Italic Bodoni Moda in an accent color is the signature flourish: the `&` between names, emphasized words in headings (`<span className="italic text-rose">three</span>`), dates, sign-off lines.
  - Display digits are proportional. For any live-updating number (countdowns, counters), wrap each digit in a fixed-width cell: `<span className="inline-block w-[0.64em] text-center">`.
- **Instrument Sans** (`font-body`) — clean sans for everything else: body copy, labels, buttons, nav.

Type patterns:

- Eyebrow/label: `text-xs tracking-[0.5em] uppercase text-text-secondary font-body` (tracking 0.2em–0.5em depending on size; smaller text gets less tracking).
- Page heading: `font-display display-wonk font-light text-foreground`, 4xl–8xl.
- Buttons/nav: uppercase, `tracking-[0.3em]`, `text-xs`.
- Body: `text-sm text-text-secondary font-body leading-relaxed`.

## 5. Shape & depth

- Radii: `rounded-full` for buttons, nav, chips, dots; `rounded-2xl`/`rounded-3xl` for cards and tiles. No sharp rectangles on interactive elements.
- Tilt: decorative cards and tiles sit slightly rotated (`-rotate-2` … `rotate-2`, alternate directions across siblings) and straighten on hover (`hover:rotate-0`). Apply tilt at `md:` and up for grid cards so mobile stacking stays tidy.
- Borders: hairline translucent white (`border border-white/60`–`/70`) on pastel surfaces — reads as a highlight, not an outline. Never gray borders on pastel.
- Shadows: soft, large-blur, heavily negative-spread, warm gray-mauve tint. House style: `shadow-[0_18px_40px_-20px_rgba(90,80,90,0.35)]` (cards), `shadow-[0_12px_28px_-14px_rgba(90,80,90,0.4)]` (tiles). CTAs may use a tinted glow: `shadow-[0_14px_30px_-12px_var(--bluebell)]`.

## 6. Backgrounds & texture

- Atmosphere = large blurred paper-wash circles ("blobs"): absolutely positioned, `rounded-full blur-3xl`, opacity 18–35%, animated with `.animate-drift` at staggered negative `animationDelay`s. Wrap them in `<div aria-hidden className="pointer-events-none absolute inset-0">`.
- Metallic flecks: a few tiny dots (`w-1 h-1` to `w-2 h-2 rounded-full`) in gold, rosewood, or ink at 20–30% opacity, scattered sparingly and animated with `.animate-bob`, `hidden sm:block`. Avoid anything that reads as party confetti.
- Grain: add the `.grain` class (defined in `globals.css`) to hero-scale sections with gradient backgrounds — a subtle SVG-noise overlay at 4% opacity. The element needs `relative` and `overflow-hidden`.
- Card surfaces use low-contrast paper gradients: `bg-linear-to-br from-warm-white via-blush/55 to-peach/55` (Tailwind v4 syntax).
- Full-bleed hero sections under the floating nav: cancel the layout's `pt-24` with `-mt-24 min-h-screen pt-28` so the backdrop reaches the viewport top.

## 7. Motion

All keyframes and utilities live in `app/globals.css`. Prefer CSS-only animation.

- Entrances (one-shot, staggered): `.animate-fade-up`, `.animate-fade-in`, `.animate-scale-in`, `.animate-draw-line` + `.delay-100` … `.delay-800`. Stagger top-to-bottom in ~100–200ms steps.
- Ambient loops: `.animate-drift` (16s, for blobs), `.animate-bob` (7s, for confetti). Both are disabled under `prefers-reduced-motion` — keep it that way for any new infinite animation.
- Micro-interactions (300–500ms, ease-out): straighten on hover (`hover:rotate-0`), lift (`hover:-translate-y-1.5` or `-translate-y-0.5` for buttons), gentle scale (`hover:scale-105`), playful tilt (`hover:-rotate-6` on the logo, `group-hover:rotate-12` on card icons).

## 8. Component recipes

- **Primary CTA**: pill, deep fill, glow shadow, lifts on hover.
  `px-10 py-4 rounded-full bg-deepblue text-warm-white text-xs tracking-[0.3em] uppercase font-body shadow-[0_14px_30px_-12px_var(--bluebell)] hover:bg-rose hover:-translate-y-0.5 transition-all duration-300`
- **Secondary CTA**: outlined pill that fills on hover.
  `px-8 py-3.5 rounded-full border-2 border-deepblue/30 text-deepblue text-xs tracking-[0.3em] uppercase hover:bg-deepblue hover:text-warm-white transition-colors duration-300`
- **Tertiary link**: letterspaced uppercase text, `text-text-secondary hover:text-rose transition-colors`.
- **Floating nav** (`app/components/FloatingNav.tsx`): centered frosted pill — `w-fit mx-auto rounded-full bg-warm-white/75 backdrop-blur-xl border border-white/70` + house shadow. Hides on scroll-down past ~96px, reappears on any scroll-up. Active nav link is a chip: `rounded-full bg-blush text-rose`; inactive links `hover:bg-blush/50 hover:text-rose`.
- **Stat tile** (see `app/components/Countdown.tsx`): pale surface + matching deep text, `rounded-2xl sm:rounded-3xl`, white hairline border, tilted, `font-display display-wonk`, fixed-width digit cells.
- **Day card** (see `DAYS` in `app/(public)/page.tsx`): tilted `rounded-3xl` low-contrast paper gradient card with an italic numeral medallion, a restrained date label in the day's accent, and a Bodoni Moda title.
- **Section divider**: a centered row of five 2px dots cycling through the deep accents at ~50–60% opacity.
- **Icons**: hand-drawn-feeling inline SVG line icons (48×48 viewBox, `fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"`). No icon libraries, no filled/emoji icons.

## 9. Voice

Copy is warm, first-person-plural, a little playful, never stiff: "We can't wait to celebrate with you", "The big one." Labels are short and letterspaced ("Save the dates", "The wedding of"). Spell out flourish-worthy dates in words where it reads as stationery.

## 10. Checklist for new UI

1. Tokens only — no raw hex, no legacy earth tokens, no default Tailwind palette colors.
2. Fraunces for display (with `.display-wonk` at hero scale), Jost for everything else.
3. Pale surface + matching deep accent, white hairline border, soft house shadow.
4. Pills and 2xl/3xl radii; something in the composition gently tilted.
5. Staggered fade-up entrance; hover that straightens, lifts, or tilts.
6. Infinite animations respect `prefers-reduced-motion`.
7. Decorative elements are `aria-hidden` and `pointer-events-none`.
8. Live numbers in Fraunces use fixed-width digit cells, not `tabular-nums`.
