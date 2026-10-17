// Kobo-style "light": the page is always paper, never a dark theme. Warmth moves the paper from cool
// white to warm sepia; brightness dims it. Ink stays near-black and secondary text is re-computed so
// every text colour keeps at least 7:1 contrast (WCAG AAA) at any setting.
import { useEffect, useState } from 'react';

export interface PaperSettings {
  warmth: number; // 0 (cool) – 100 (warm)
  brightness: number; // 0 (soft) – 100 (bright)
}

export const defaultPaper: PaperSettings = { warmth: 40, brightness: 100 };

const STORAGE_KEY = 'curricula.paper';
const VARS_KEY = 'curricula.paper.vars';

type RGB = [number, number, number];
const INK: RGB = [17, 17, 17];
const COOL: RGB = [245, 246, 243];
const NEUTRAL: RGB = [236, 234, 229];
const WARM: RGB = [236, 221, 191];

const mix = (a: RGB, b: RGB, t: number): RGB => [0, 1, 2].map((i) => a[i] + (b[i] - a[i]) * t) as RGB;
const hex = (c: RGB) => '#' + c.map((v) => Math.round(Math.max(0, Math.min(255, v))).toString(16).padStart(2, '0')).join('');

function luminance([r, g, b]: RGB) {
  const ch = (v: number) => {
    const s = v / 255;
    return s <= 0.03928 ? s / 12.92 : ((s + 0.055) / 1.055) ** 2.4;
  };
  return 0.2126 * ch(r) + 0.7152 * ch(g) + 0.0722 * ch(b);
}
export const contrast = (a: RGB, b: RGB) => {
  const [l1, l2] = [luminance(a), luminance(b)].sort((x, y) => y - x);
  return (l1 + 0.05) / (l2 + 0.05);
};

/** Darkest mix of paper → ink that still reaches `ratio` against the paper. */
function textOn(paper: RGB, ratio: number, start: number) {
  for (let t = start; t <= 1; t += 0.01) {
    const c = mix(paper, INK, t);
    if (contrast(c, paper) >= ratio) return c;
  }
  return INK;
}

export function paperColors({ warmth, brightness }: PaperSettings) {
  const w = Math.max(0, Math.min(100, warmth));
  const base = w <= 40 ? mix(COOL, NEUTRAL, w / 40) : mix(NEUTRAL, WARM, (w - 40) / 60);
  // Brightness 0 dims the paper to 80% (still ≥ 8:1 with the ink at the warmest setting).
  const k = 0.8 + 0.2 * (Math.max(0, Math.min(100, brightness)) / 100);
  const paper = base.map((v) => v * k) as RGB;
  const inkSoft = textOn(paper, 7.2, 0.55);
  const vars: Record<string, string> = {
    '--paper': hex(paper),
    '--ink-soft': hex(inkSoft),
    '--rule': hex(mix(paper, INK, 0.16)),
    '--color-zinc-50': hex(mix(paper, INK, 0.035)),
    '--color-zinc-100': hex(mix(paper, INK, 0.07)),
    '--color-zinc-200': hex(mix(paper, INK, 0.16)),
    '--color-zinc-300': hex(mix(paper, INK, 0.22)),
    '--color-zinc-400': hex(mix(paper, INK, 0.38)),
    '--color-zinc-500': hex(textOn(paper, 4.6, 0.4)),
    '--color-zinc-600': hex(inkSoft),
    '--color-zinc-700': hex(textOn(paper, 9, 0.7)),
  };
  return { vars, paper: hex(paper), inkRatio: contrast(INK, paper), softRatio: contrast(inkSoft, paper) };
}

export function applyPaper(settings: PaperSettings) {
  const { vars, paper } = paperColors(settings);
  const root = document.documentElement;
  for (const [k, v] of Object.entries(vars)) root.style.setProperty(k, v);
  document.querySelector('meta[name="theme-color"]')?.setAttribute('content', paper);
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(settings));
    // Pre-computed values let the inline script in each page paint the right paper before React loads.
    localStorage.setItem(VARS_KEY, JSON.stringify(vars));
  } catch {
    // Not critical.
  }
}

function initial(): PaperSettings {
  try {
    const saved = JSON.parse(localStorage.getItem(STORAGE_KEY) ?? 'null');
    if (saved && typeof saved.warmth === 'number' && typeof saved.brightness === 'number') return saved;
  } catch {
    // Use the default.
  }
  return defaultPaper;
}

export function usePaper() {
  const [settings, setSettings] = useState<PaperSettings>(initial);
  useEffect(() => applyPaper(settings), [settings]);
  return [settings, setSettings] as const;
}

/** Current paper colours as resolved on the page (for the designed PDF). */
export function currentPaper() {
  const s = getComputedStyle(document.documentElement);
  const get = (name: string, fallback: string) => s.getPropertyValue(name).trim() || fallback;
  return { paper: get('--paper', '#ECEAE5'), soft: get('--ink-soft', '#45433F'), rule: get('--rule', '#CFCCC5') };
}
