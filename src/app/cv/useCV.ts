// Reading CVs from storage, files, links and the public CV server: fill in whatever is missing so older
// data still renders, and keep only safe values, since a public CV may come from anyone.
import { blankCV, newId } from './defaultCV';
import type { CVData } from './types';

type Obj = Record<string, unknown>;

const obj = (v: unknown): Obj => (v && typeof v === 'object' && !Array.isArray(v) ? (v as Obj) : {});
const str = (v: unknown, max = 5000) => (typeof v === 'string' ? v.slice(0, max) : typeof v === 'number' ? String(v) : '');
const list = (v: unknown) => (Array.isArray(v) ? v.slice(0, 200) : []);
const id = (v: unknown) => (typeof v === 'string' && v ? v.slice(0, 40) : newId());

/** Images are only ever our own data URLs or built-in logo tokens: never remote URLs or scripts. */
export function safeImage(v: unknown): string | undefined {
  if (typeof v !== 'string') return undefined;
  if (/^@logo:[a-z]+:[\w-]+$/.test(v)) return v;
  if (/^data:image\/(png|jpe?g|webp|gif|svg\+xml)[;,]/i.test(v) && v.length <= 400_000) return v;
  return undefined;
}

/** Fills in any missing fields so older or hand-edited JSON still renders, and drops anything unsafe. */
export function normalize(input: unknown): CVData {
  const data = obj(input);
  const p = obj(data.profile);
  return {
    version: 1,
    isPublic: data.isPublic === true,
    profile: {
      ...blankCV.profile,
      name: str(p.name, 200),
      headline: str(p.headline, 300),
      email: str(p.email, 200),
      phone: str(p.phone, 80),
      location: str(p.location, 200),
      website: str(p.website, 300),
      linkedin: str(p.linkedin, 300),
      photo: safeImage(p.photo),
    },
    summary: str(data.summary),
    skills: list(data.skills).filter((s): s is string => typeof s === 'string').map((s) => s.slice(0, 120)),
    tools: list(data.tools).map((t) => {
      const o = obj(t);
      return { id: id(o.id), name: str(o.name, 120), description: str(o.description, 300), icon: safeImage(o.icon) };
    }),
    experience: list(data.experience).map((e) => {
      const o = obj(e);
      return {
        id: id(o.id),
        title: str(o.title, 200),
        company: str(o.company, 200),
        location: str(o.location, 200),
        employmentType: str(o.employmentType, 100),
        start: str(o.start, 40),
        end: str(o.end, 40),
        bullets: list(o.bullets).map((b) => str(b, 1000)),
        logo: safeImage(o.logo),
      };
    }),
    education: list(data.education).map((e) => {
      const o = obj(e);
      return { id: id(o.id), degree: str(o.degree, 200), school: str(o.school, 200), location: str(o.location, 200), start: str(o.start, 40), end: str(o.end, 40), details: str(o.details, 1000) };
    }),
    certifications: list(data.certifications).map((c) => {
      const o = obj(c);
      return { id: id(o.id), title: str(o.title, 200), description: str(o.description, 300), issuer: str(o.issuer, 200), year: str(o.year, 40) };
    }),
    languages: list(data.languages).map((l) => {
      const o = obj(l);
      return { id: id(o.id), name: str(o.name, 100), level: str(o.level, 100) };
    }),
  };
}
