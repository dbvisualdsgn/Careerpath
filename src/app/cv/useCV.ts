// Reading CVs from storage, files and links: fill in whatever is missing so older data still renders.
import { blankCV } from './defaultCV';
import type { CVData } from './types';

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
