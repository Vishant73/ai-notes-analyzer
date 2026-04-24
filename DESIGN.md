# Design Brief

**Tone**: Editorial, brutalist-minimal. Academic rigor meets premium study tool (Linear, Notion aesthetic). Zero decoration.

**Differentiation**: Information density with breathing room. Summary cards side-by-side, keywords as semantic tags, dashboard stats prominent. Clean hierarchy through typography and spacing, not color.

## Color Palette

| Token | OKLCH | Purpose |
|-------|-------|---------|
| Primary | `0.43 0.25 284` | Deep indigo — authority, intelligence, header anchor |
| Accent | `0.65 0.22 140` | Bright emerald — success states, AI processing, keyword tags |
| Destructive | `0.54 0.21 24` | Subtle red — critical actions only |
| Neutral | `0.98 0.01 240` (light), `0.12 0.01 240` (dark) | True grey — editorial clarity, no warmth |
| Background | `0.98 0.01 240` (light), `0.12 0.01 240` (dark) | Reading surface, minimal chroma |
| Card | `1.0 0 0` (light), `0.17 0.01 240` (dark) | Content containers, clear surfaces |
| Border | `0.91 0.02 240` | Minimal contrast, visual hierarchy through typography |

## Typography

| Role | Font | Scale | Usage |
|------|------|-------|-------|
| Display | Space Grotesk | 4xl/2xl/xl | Page titles, section headers, summary titles |
| Body | Figtree | lg/base/sm | Content, descriptions, form labels |
| Mono | JetBrains Mono | sm | Keywords, technical terms, tag labels |

**Weight Strategy**: Bold for display (headers, CTAs), semibold for navigation, regular for body. Tracking tight on display fonts.

## Structural Zones

| Zone | Background | Border | Treatment |
|------|-----------|--------|-----------|
| Header | Primary (`0.43 0.25 284`) | None | Solid anchor, white text, navigation + title |
| Sidebar | Card (`1.0 0`) | Border (`0.91 0.02 240`) | Minimal, navigation items flush left, accent on active |
| Main Content | Background (`0.98 0.01 240`) | None | Reading surface, baseline grid |
| Cards | Alternating: Card (`1.0 0`) + Muted (`0.92 0.02 240`) | Border (`0.91 0.02 240`) | Summary boxes, note list items, minimal shadow |
| Footer | Secondary (`0.94 0.03 240`) | Border-top | Metadata, copyright, quiet |

## Component Patterns

- **Buttons**: Primary (filled indigo), Secondary (outlined), Minimal (text-only). No rounded corners beyond `0.5rem`. Sharp edges for brutalism.
- **Cards**: Border-bottom only for note items, full border for summary containers. Spacing `1rem` inside, `1.5rem` between.
- **Tags/Badges**: Semantic color (`accent` for keywords, `chart-1` for success, `destructive` for warnings). Mono font. Rounded-full, compact.
- **Summary Layout**: Grid 3-column on `lg`, 2-column on `md`, 1-column on `sm`. Equal-width containers with tight spacing.
- **Inputs**: Border, no fill. Focus: `ring-2` with primary color. Placeholder: `text-muted-foreground`.

## Spacing & Rhythm

- **Container**: `2rem` padding, max-width `7xl`
- **Gaps**: `1.5rem` between sections, `1rem` between cards, `0.5rem` between badge/tag groups
- **Type scale**: Consistent 1.5x multiplier — 12px → 18px → 27px base
- **Line height**: 1.6 for body (reading), 1.2 for display (compact)

## Motion

- **Transition default**: `all 0.3s cubic-bezier(0.4, 0, 0.2, 1)` (easeInOutQuart)
- **State changes**: Hover buttons darken 5% lightness. Focus states use `ring-2 primary`.
- **Loading**: Subtle pulse on processing badges, no bounce animations.

## Constraints

✓ Mobile-first responsive (`sm`, `md`, `lg`, `xl`)
✓ Light mode primary (dark mode available via `.dark` class)
✓ No gradients, blur, or glassmorphism
✓ Shadows: `shadow-sm` only (minimal elevation)
✓ Border radius: `0.5rem` max (sharp aesthetic)
✓ No color mixing with opacity — use semantic color tokens
✓ All interactive elements 44px min-height for accessibility

## Signature Detail

Summary cards displayed in true 3-column grid with keyword tags flush-right in each card. Dashboard stats bar at top uses display typography (Space Grotesk bold) with emerald accent. Navigation items use dark indigo on hover — semantic. Processing badge pulses emerald on save action.

## Assets

- Fonts: Space Grotesk (display), Figtree (body), JetBrains Mono (mono) — bundled, no CDN fallback needed
