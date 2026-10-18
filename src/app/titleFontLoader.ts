// Title fonts load on demand. Each is one bold file registered for every weight (100–900), so titles are
// always drawn with the real bold face, whatever weight class an element asks for. The chosen font is
// registered as "Title Active"; Clash Display, the default, is bundled with the CSS.
import { titleFonts } from './titleFonts';

export const DEFAULT_TITLE = 'clash-display';
const ACTIVE = 'Title Active';
const PRE_PAINT_STYLE = 'title-font-face';

export const isTitleSlug = (slug: unknown): slug is string => typeof slug === 'string' && titleFonts.some((f) => f.slug === slug);

/** Root of the site (pages live at /, /app/ and /people/). */
function siteRoot() {
  const path = window.location.pathname.replace(/(app|people)\/(index\.html)?$/, '').replace(/index\.html$/, '');
  return new URL(path, window.location.origin);
}
export const titleFontUrl = (slug: string, ext: 'woff2' | 'ttf') => new URL(`fonts/titles/${slug}.${ext}`, siteRoot()).href;

const previews = new Map<string, Promise<void>>();

/** The family name a menu row uses to preview a font in itself. */
export const previewFamily = (slug: string) => `Title Preview ${slug}`;

/** Loads a font for its preview in the Typefaces menu (once). */
export function loadPreview(slug: string) {
  if (!previews.has(slug)) {
    const face = new FontFace(previewFamily(slug), `url(${titleFontUrl(slug, 'woff2')}) format('woff2')`, { weight: '100 900', display: 'swap' });
    previews.set(
      slug,
      face.load().then(
        (f) => void document.fonts.add(f),
        () => undefined,
      ),
    );
  }
  return previews.get(slug)!;
}

let active: FontFace | null = null;

/** Makes `slug` the title font of the page. */
export function applyTitleFont(slug: string) {
  // The pre-paint script may already have set this very font: keep it, so nothing flickers.
  const prePaint = document.getElementById(PRE_PAINT_STYLE);
  if (prePaint?.dataset.slug === slug) return;
  prePaint?.remove();
  if (active) document.fonts.delete(active);
  active = null;
  if (slug === DEFAULT_TITLE || !isTitleSlug(slug)) return;
  const face = new FontFace(ACTIVE, `url(${titleFontUrl(slug, 'woff2')}) format('woff2')`, { weight: '100 900', display: 'swap' });
  active = face;
  document.fonts.add(face);
  face.load().catch(() => undefined);
}
