import { useEffect, useSyncExternalStore } from 'react';
import { applyTitleFont, DEFAULT_TITLE, isTitleSlug } from './titleFontLoader';

// The Typefaces menu picks a title font (any vetted Fontshare family, always bold) and a text face
// (Switzer or Gambetta). The inline script in each page applies both before first paint.
export type Face = 'sans' | 'serif';
export const faces: Face[] = ['sans', 'serif'];
export interface TypeFaces {
  /** Slug of a font in titleFonts.ts. */
  title: string;
  body: Face;
}
export const defaultFaces: TypeFaces = { title: DEFAULT_TITLE, body: 'serif' };

/** Earlier title choices were just "sans" or "serif". */
const titleFrom = (v: string | null) => (v === 'sans' ? 'switzer' : v === 'serif' ? 'gambetta' : isTitleSlug(v) ? v : DEFAULT_TITLE);

const TITLE_KEY = 'curricula.title';
const BODY_KEY = 'curricula.body';
const LEGACY_KEY = 'curricula.type';

const isFace = (v: unknown): v is Face => v === 'sans' || v === 'serif';

function load(): TypeFaces {
  try {
    // One-time move from the single reading style ("sans" | "serif" | "mono") to title + text.
    const legacy = localStorage.getItem(LEGACY_KEY);
    if (legacy !== null) {
      const face = legacy === 'serif' ? 'serif' : 'sans';
      if (localStorage.getItem(TITLE_KEY) === null) localStorage.setItem(TITLE_KEY, titleFrom(face));
      if (localStorage.getItem(BODY_KEY) === null) localStorage.setItem(BODY_KEY, face);
      localStorage.removeItem(LEGACY_KEY);
    }
    const body = localStorage.getItem(BODY_KEY);
    return { title: titleFrom(localStorage.getItem(TITLE_KEY)), body: isFace(body) ? body : defaultFaces.body };
  } catch {
    return defaultFaces;
  }
}

let state = load();
const listeners = new Set<() => void>();
const subscribe = (l: () => void) => {
  listeners.add(l);
  return () => listeners.delete(l);
};

let appliedTitle: string | null = null;
function apply({ title, body }: TypeFaces) {
  document.documentElement.dataset.body = body;
  if (title !== appliedTitle) {
    appliedTitle = title;
    applyTitleFont(title);
  }
}

export function setFaces(next: Partial<TypeFaces>) {
  state = { ...state, ...next };
  apply(state);
  try {
    localStorage.setItem(TITLE_KEY, state.title);
    localStorage.setItem(BODY_KEY, state.body);
  } catch {
    // Not critical.
  }
  listeners.forEach((l) => l());
}

/** The current title and text typefaces (used by the PDF so it matches the page). */
export const currentFaces = () => state;

export function useTypeFaces() {
  const value = useSyncExternalStore(subscribe, () => state);
  useEffect(() => apply(value), [value]);
  return value;
}
