// Built-in logos load on demand. CVs refer to them by short tokens (`@logo:brand:figma`), so pages that only
// show a CV don't download the whole logo set, and share links stay short.
import { useEffect, useReducer } from 'react';
import { companyLogos } from './companyLogos';
import type { CVData } from './types';

export const LOGO_TOKEN = '@logo:';
export const brandLogo = (key: string) => `${LOGO_TOKEN}brand:${key}`;
export const companyLogo = (key: keyof typeof companyLogos) => `${LOGO_TOKEN}company:${key}`;
export const isLogoToken = (src?: string): src is string => Boolean(src?.startsWith(LOGO_TOKEN));

let brand: Record<string, string> | null = null;
let loading: Promise<Record<string, string>> | null = null;

/** Loads the brand logo set once. */
export function loadBrandIcons() {
  loading ??= import('./brandIcons').then((m) => (brand = m.brandIcons));
  return loading;
}

/** The image for a logo: tokens become data URLs (once loaded), anything else passes through. */
export function logoData(src?: string): string | undefined {
  if (!isLogoToken(src)) return src;
  const [kind, key] = src.slice(LOGO_TOKEN.length).split(':');
  if (kind === 'company') return (companyLogos as Record<string, string>)[key];
  return brand?.[key];
}

export async function resolveLogo(src?: string) {
  if (isLogoToken(src) && !src.startsWith(`${LOGO_TOKEN}company:`)) await loadBrandIcons().catch(() => undefined);
  return logoData(src);
}

/** A logo's image for rendering; re-renders once the logo set has loaded. */
export function useLogo(src?: string) {
  const [, loaded] = useReducer((n: number) => n + 1, 0);
  const data = logoData(src);
  // Unknown tokens (a logo that no longer exists) stop waiting once the set has loaded.
  const waiting = isLogoToken(src) && data === undefined && brand === null && !src.startsWith(`${LOGO_TOKEN}company:`);
  useEffect(() => {
    if (waiting) loadBrandIcons().then(loaded, () => undefined);
  }, [waiting]);
  return { data, waiting };
}

export function mapLogos(cv: CVData, fn: (logo: string | undefined) => string | undefined): CVData {
  return {
    ...cv,
    tools: cv.tools.map((t) => ({ ...t, icon: fn(t.icon) })),
    experience: cv.experience.map((e) => ({ ...e, logo: fn(e.logo) })),
  };
}

/** Swaps built-in logo images for their tokens (older CVs stored the full data). */
export async function tokenizeLogos(cv: CVData) {
  const set = await loadBrandIcons();
  const tokenFor = new Map<string, string>([
    ...Object.entries(set).map(([k, v]) => [v, brandLogo(k)] as [string, string]),
    ...Object.entries(companyLogos).map(([k, v]) => [v, `${LOGO_TOKEN}company:${k}`] as [string, string]),
  ]);
  return mapLogos(cv, (logo) => (logo ? tokenFor.get(logo) ?? logo : logo));
}

/** Replaces tokens with images, for output that needs the pixels (the designed PDF). */
export async function resolveLogos(cv: CVData) {
  const tools = await Promise.all(cv.tools.map((t) => resolveLogo(t.icon)));
  const logos = await Promise.all(cv.experience.map((e) => resolveLogo(e.logo)));
  return {
    ...cv,
    tools: cv.tools.map((t, i) => ({ ...t, icon: tools[i] })),
    experience: cv.experience.map((e, i) => ({ ...e, logo: logos[i] })),
  };
}
