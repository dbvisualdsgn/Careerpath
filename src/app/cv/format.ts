import type { AvatarMode, CVData, Profile } from './types';

export const dateRange = (start: string, end: string) => [start, end].filter((s) => s.trim()).join(' – ');

export const initials = (name: string) =>
  name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((p) => p[0]?.toUpperCase())
    .join('') || 'CV';

export const displayUrl = (url: string) => url.replace(/^https?:\/\//, '').replace(/\/$/, '');
export const hrefUrl = (url: string) => (/^https?:\/\//.test(url) ? url : `https://${url}`);

export function contactItems(cv: CVData) {
  const p = cv.profile;
  return [p.email, p.phone, p.location, p.linkedin && displayUrl(p.linkedin), p.website && displayUrl(p.website)].filter(
    Boolean,
  ) as string[];
}

export function toJsonLd(cv: CVData) {
  const p = cv.profile;
  return {
    '@context': 'https://schema.org',
    '@type': 'Person',
    name: p.name,
    jobTitle: p.headline,
    description: cv.summary,
    email: p.email ? `mailto:${p.email}` : undefined,
    telephone: p.phone || undefined,
    address: p.location ? { '@type': 'PostalAddress', addressLocality: p.location } : undefined,
    url: p.website ? hrefUrl(p.website) : undefined,
    sameAs: p.linkedin ? [hrefUrl(p.linkedin)] : undefined,
    knowsAbout: [...cv.skills, ...cv.tools.map((t) => t.name)],
    knowsLanguage: cv.languages.map((l) => l.name),
    hasCredential: cv.certifications.map((c) => ({
      '@type': 'EducationalOccupationalCredential',
      name: c.title,
      recognizedBy: { '@type': 'Organization', name: c.issuer },
    })),
    alumniOf: cv.education.map((e) => ({ '@type': 'EducationalOrganization', name: e.school })),
    worksFor: cv.experience
      .filter((e) => PRESENT.test(e.end))
      .map((e) => ({ '@type': 'Organization', name: e.company })),
  };
}

const PRESENT = /^(present|current|now)$/i;


export const fileSlug = (name: string) => name.trim().replace(/\s+/g, '_').replace(/[^\w-]/g, '') || 'CV';

/** What to show next to the name. Older CVs have no choice saved: their photo if they have one, else nothing. */
export const avatarOf = (p: Profile): AvatarMode =>
  p.avatar === 'initials' ? 'initials' : p.avatar === 'none' || !p.photo ? 'none' : 'photo';
