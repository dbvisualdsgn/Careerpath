import { useCallback, useEffect, useState } from 'react';
import { blankCV, sampleCV } from './defaultCV';
import type { CVData } from './types';

const STORAGE_KEY = 'careerpath.cv.v1';

function load(): CVData {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) return normalize(JSON.parse(raw));
  } catch {
    // Storage unavailable or corrupted: fall back to the sample.
  }
  return sampleCV;
}

/** Fills in any missing fields so older or hand-edited JSON still renders. */
export function normalize(input: unknown): CVData {
  const data = (input && typeof input === 'object' ? input : {}) as Partial<CVData>;
  const arr = <T,>(v: T[] | undefined) => (Array.isArray(v) ? v : []);
  return {
    version: 1,
    isPublic: data.isPublic === true,
    profile: { ...blankCV.profile, ...(data.profile ?? {}) },
    summary: typeof data.summary === 'string' ? data.summary : '',
    skills: arr(data.skills).filter((s) => typeof s === 'string'),
    tools: arr(data.tools),
    experience: arr(data.experience).map((e) => ({ ...e, bullets: arr(e.bullets) })),
    education: arr(data.education),
    certifications: arr(data.certifications),
    languages: arr(data.languages),
  };
}

export function useCV() {
  const [cv, setCV] = useState<CVData>(load);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(cv));
    } catch {
      // Ignore quota or privacy-mode errors; the CV still works for this session.
    }
  }, [cv]);

  const update = useCallback((fn: (draft: CVData) => CVData) => setCV((prev) => fn(prev)), []);

  return { cv, setCV, update };
}
