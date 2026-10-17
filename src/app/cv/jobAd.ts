// The pasted job ad and its title, shared by the check panel, the score in the header and the summary card.
// The ad text keeps its original storage key (`careerpath.jd.v1`) so nobody loses what they pasted.
import { useSyncExternalStore } from 'react';
import { extractJobTitle } from './atsCheck';

const TEXT_KEY = 'careerpath.jd.v1';
const TITLE_KEY = 'curricula.jdtitle.v1';

interface JobAd {
  text: string;
  /** The person's own edit of the title; null means "use the one found in the ad". */
  titleEdit: string | null;
}

function read(key: string) {
  try {
    return localStorage.getItem(key);
  } catch {
    return null;
  }
}
function write(key: string, value: string | null) {
  try {
    if (value === null) localStorage.removeItem(key);
    else localStorage.setItem(key, value);
  } catch {
    // Not critical: the ad still works for this session.
  }
}

let state: JobAd = { text: read(TEXT_KEY) ?? '', titleEdit: read(TITLE_KEY) };
const listeners = new Set<() => void>();
const emit = () => listeners.forEach((l) => l());
const subscribe = (l: () => void) => {
  listeners.add(l);
  return () => listeners.delete(l);
};

export function setJobAdText(text: string) {
  // A new ad means a new title: drop the old edit.
  state = { text, titleEdit: null };
  write(TEXT_KEY, text);
  write(TITLE_KEY, null);
  emit();
}

export function setJobAdTitle(title: string) {
  state = { ...state, titleEdit: title };
  write(TITLE_KEY, title);
  emit();
}

/** The job ad, plus its title (the person's edit, or the one found in the ad). Empty when no ad is pasted. */
export function useJobAd() {
  const ad = useSyncExternalStore(subscribe, () => state);
  const hasAd = ad.text.trim().length > 0;
  const title = hasAd ? (ad.titleEdit ?? extractJobTitle(ad.text)) : '';
  return { text: ad.text, title, hasAd };
}
