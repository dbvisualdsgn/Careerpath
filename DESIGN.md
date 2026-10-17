# curriculi curricula: design system

A CV tool that reads like a page. Black and white, built from type, inspired by Kindle/Kobo
e-readers and Swiss editorial layouts. Three small accents (highlight, signal, go), no shadows, no gradients, and only the quiet motion described below.

## Brand

The brand is type only: **curriculi *curricula***, always lowercase, *curricula* in italics, set in the
reading font (`Wordmark`). There is no logo, mark, monogram or icon next to it. On narrow screens the name
gets smaller (15px, 17px from `sm`), never hidden. The favicon is the letters "cc" in ink on paper.

## Colour tokens (`src/styles/theme.css`)

| Token | Default | Use |
|---|---|---|
| `--paper` | `#ECEAE5` | Page background (e-ink paper), set by the Light panel |
| `--ink` | `#111111` | Text, rules that open a section, primary buttons |
| `--ink-soft` | computed | Secondary text, always ≥ 7:1 on the current paper (AAA) |
| `--rule` | computed | Hairlines between entries, field borders |
| `--focus` | ink | 2px focus outline, offset 2px |
| `--highlight` / `--signal` / `--go` | `#E6F05A` / `#E5482A` / `#2F8F5B` | Highlighter, error dot, passed check; text on them stays ink |

### Light (instead of dark mode)

There is no dark theme: a CV is a page to read and print. Like a Kobo, the **Light** panel (`PaperControls`,
`src/app/paper.ts`) has two sliders. **Warmth** moves the paper from cool white `#F5F6F3` through `#ECEAE5` to
warm `#ECDDBF`; **Brightness** dims it down to 80%. Ink stays `#111`, and the secondary greys are recomputed
for every setting, so all 441 combinations keep text contrast ≥ 7.2:1 (WCAG AAA). The choice is saved, applied
before first paint by an inline script, and used as the paper colour of the "As on the page" PDF.

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
- **Button states (everywhere):** hover = outline fills with ink (or a tint for ghost buttons); pressed = 1px nudge
  down; selected (`aria-pressed`, open menu) = ink fill; focus = 2px ink outline, offset 2px; disabled = 50% opacity.
- **Segmented tabs:** one hairline box divided by ink rules. Inactive = soft text, hover = tint + ink text,
  selected = ink fill with paper text, focus = inset outline.
- **Editor sheet:** same paper as the page with a hairline edge; an ink header band is what marks it as the tool,
  not part of the CV.
- **ATS score mark:** dashed outline (<65), outline (65–84), filled (≥85), always with the number.
- **Icons:** Lucide only, 16–22px, stroke 1.5–2, always `aria-hidden` next to a text label.

## Motion

Motion is allowed only where it helps reading, and it never hides content for long:
- **One reveal per section:** a section fades and rises 8px once, the first time it scrolls into view
  (`useReveal` + `.reveal`). A timer shows it anyway after 2.5s.
- **Count-up on scores:** score numbers count up once (`useCountUp`), about 0.7–1.1s.
- **Small details:** the highlighter stroke draws in, score bars grow, arrows nudge 2–3px on hover, the
  share-link dot travels, the hero caret blinks, switches slide.
- **Reduced motion:** with `prefers-reduced-motion: reduce`, all of it is off. Sections, highlights and bars
  are shown at once, numbers show their final value, nothing loops.

No page transitions, parallax, scroll-jacking or motion that carries meaning on its own.

## Accessibility

WCAG 2.2 AA with zero axe-core violations, plus AAA text contrast (axe `color-contrast-enhanced`),
at every Light setting. Includes a skip link, landmarks, a logical heading order, a native radio group
for the type switch, visible focus, and motion that switches off under reduced motion.
