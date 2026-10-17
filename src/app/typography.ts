import { useEffect, useSyncExternalStore } from 'react';

// Two typefaces only: one sans, one reading serif. The "Aa" menu picks one for titles and one for text,
// set as data-title / data-body on <html> (the inline script in each page applies them before first paint).
export type Face = 'sans' | 'serif';
export const faces: Face[] = ['sans', 'serif'];
export interface TypeFaces {
  title: Face;
  body: Face;
}
export const defaultFaces: TypeFaces = { title: 'sans', body: 'serif' };

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
      if (localStorage.getItem(TITLE_KEY) === null) localStorage.setItem(TITLE_KEY, face);
      if (localStorage.getItem(BODY_KEY) === null) localStorage.setItem(BODY_KEY, face);
      localStorage.removeItem(LEGACY_KEY);
    }
    const title = localStorage.getItem(TITLE_KEY);
    const body = localStorage.getItem(BODY_KEY);
    return { title: isFace(title) ? title : defaultFaces.title, body: isFace(body) ? body : defaultFaces.body };
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

function apply({ title, body }: TypeFaces) {
  document.documentElement.dataset.title = title;
  document.documentElement.dataset.body = body;
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
