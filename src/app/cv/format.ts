import type { CVData, Experience } from './types';
import type { Messages } from '../i18n/en';

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

const expMeta = (e: Experience) => [e.company, e.location, e.employmentType].filter(Boolean).join(' | ');

/** Plain-text version for pasting into ATS application forms. */
export function toPlainText(cv: CVData, m: Messages) {
  const out: string[] = [];
  const section = (title: string) => out.push('', title.toUpperCase(), '');
  out.push(cv.profile.name, cv.profile.headline, contactItems(cv).join(' | '));
  if (cv.summary.trim()) {
    section(m.sections.summary);
    out.push(cv.summary.trim());
  }
  if (cv.skills.length || cv.tools.length) {
    section(m.sections.skills);
    if (cv.skills.length) out.push(`${m.sections.coreSkills}: ${cv.skills.join(', ')}`);
    if (cv.tools.length) out.push(`${m.sections.toolsShort}: ${cv.tools.map((t) => t.name).join(', ')}`);
  }
  if (cv.experience.length) {
    section(m.sections.experience);
    cv.experience.forEach((e, i) => {
      if (i) out.push('');
      out.push(`${e.title}`, `${expMeta(e)}${e.start || e.end ? ` | ${dateRange(e.start, e.end)}` : ''}`);
      e.bullets.filter((b) => b.trim()).forEach((b) => out.push(`- ${b.trim()}`));
    });
  }
  if (cv.education.length) {
    section(m.sections.education);
    cv.education.forEach((e) => {
      out.push(`${e.degree}, ${e.school}${e.location ? `, ${e.location}` : ''}${e.start || e.end ? ` | ${dateRange(e.start, e.end)}` : ''}`);
      if (e.details.trim()) out.push(e.details.trim());
    });
  }
  if (cv.certifications.length) {
    section(m.sections.certifications);
    cv.certifications.forEach((c) =>
      out.push(`- ${c.title}${c.description ? ` (${c.description})` : ''}, ${c.issuer}${c.year ? `, ${c.year}` : ''}`),
    );
  }
  if (cv.languages.length) {
    section(m.sections.languages);
    out.push(cv.languages.map((l) => (l.level ? `${l.name} (${l.level})` : l.name)).join(', '));
  }
  return out.join('\n').trim() + '\n';
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

export function downloadFile(filename: string, content: string, type: string) {
  const url = URL.createObjectURL(new Blob([content], { type }));
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

export const fileSlug = (name: string) => name.trim().replace(/\s+/g, '_').replace(/[^\w-]/g, '') || 'CV';
