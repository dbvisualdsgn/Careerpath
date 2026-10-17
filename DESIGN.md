# curriculi curricula: design system

A CV tool that reads like a page. Black and white, built from type, inspired by Kindle/Kobo
e-readers and Swiss editorial layouts. No accent colours, no shadows, no gradients, no motion.

## Colour tokens (`src/styles/theme.css`)

| Token | Day | Night | Use |
|---|---|---|---|
| `--paper` | `#ECEAE5` | `#111111` | Page background (warm, e-ink paper) |
| `--ink` | `#111111` | `#ECEAE5` | Text, rules that open a section, primary buttons |
| `--ink-soft` | `#45433F` | `#B5B2AB` | Secondary text and metadata (AAA, ≥7:1 on paper) |
| `--rule` | `#CFCCC5` | `#33312E` | Hairlines between entries, field borders |
| `--focus` | ink | ink | 2px focus outline, offset 2px |

Tailwind's `zinc-*` and `white` are remapped onto this warm neutral scale, and every `shadow-*` is
flat. Brand logos inside a CV are the only colour on screen (they belong to the CV, not the brand).

## Typography

Three reading styles, switched with the **Aa** menu (`TypeSwitcher`), stored per browser and applied
before first paint via `data-type` on `<html>` → `--reading-font` → the `font-reading` utility.

| Style | Family | Character |
|---|---|---|
| Sans (default) | Inter Tight | Swiss, tight grotesk |
| Serif | Literata | E-reader serif (Kindle feel) |
| Mono | IBM Plex Mono | Typewriter |

- **Display:** `clamp()` sizes up to ~7rem, weight 400, tracking −0.035em, leading 0.92.
- **Numerals:** 72px light, for chapter and step numbers (`01`–`04`).
- **Micro labels:** IBM Plex Mono 11–12px, uppercase, tracking 0.14em, `ink-soft`.
- **Body:** reading font, 16–20px, measure ≤60ch.
- **UI controls and form fields:** Inter Tight. The PDF uses Helvetica (best for ATS parsing).

## Patterns

- **Section opener:** 1px ink rule, mono title on the left, running number on the right (`SectionHead`).
- **Ruled lists:** entries separated by `rule` hairlines (experience, education, FAQ).
- **Hairline grids:** `gap-px` on a `rule` background (steps, tools, languages).
- **Buttons:** primary = ink fill / paper text; secondary = 1px ink outline; tertiary = underlined text link.
- **ATS score mark:** dashed outline (<65), outline (65–84), filled (≥85), always with the number.
- **Icons:** Lucide only, 16–22px, stroke 1.5–2, always `aria-hidden` next to a text label.

## Accessibility

WCAG 2.2 AA with zero axe-core violations, plus AAA text contrast (axe `color-contrast-enhanced`),
in day and night. Includes a skip link, landmarks, a logical heading order, a native radio group
for the type switch, visible focus, and no motion.
