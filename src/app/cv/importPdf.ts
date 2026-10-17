// Fills a CV from a PDF. PDFs made here carry the exact CV in their metadata and come back 1:1.
// Any other PDF is read as text and split into sections with multilingual heading and date rules.
import { blankCV, newId } from './defaultCV';
import { PDF_DATA_NS, unpackCV } from './share';
import { findIcon } from './iconCatalog';
import type { CVData, Experience } from './types';

export class PdfImportError extends Error {
  constructor(public code: 'unreadable' | 'no-text') {
    super(code);
  }
}

async function loadPdfJs() {
  const pdfjs = await import('pdfjs-dist');
  const worker = await import('pdfjs-dist/build/pdf.worker.min.mjs?url');
  pdfjs.GlobalWorkerOptions.workerSrc = worker.default;
  return pdfjs;
}

/** Text lines in reading order: items on the same baseline are joined, left to right. */
async function readLines(doc: { numPages: number; getPage: (n: number) => Promise<any> }) {
  const lines: string[] = [];
  for (let n = 1; n <= doc.numPages; n++) {
    const page = await doc.getPage(n);
    const content = await page.getTextContent();
    const rows = new Map<number, { x: number; w: number; size: number; str: string }[]>();
    for (const item of content.items as { str: string; transform: number[]; width: number }[]) {
      if (!item.str) continue;
      const y = Math.round(item.transform[5] / 2) * 2; // tolerate tiny baseline differences
      const row = rows.get(y) ?? [];
      row.push({ x: item.transform[4], w: item.width ?? 0, size: Math.abs(item.transform[0]) || 10, str: item.str });
      rows.set(y, row);
    }
    [...rows.entries()]
      .sort((a, b) => b[0] - a[0])
      .forEach(([, row]) => {
        row.sort((a, b) => a.x - b.x);
        // Pieces of one word sit edge to edge; only add a space where there is a visible gap.
        let text = '';
        let end = -Infinity;
        for (const r of row) {
          const gap = r.x - end;
          if (text && gap > r.size * 0.18 && !text.endsWith(' ') && !r.str.startsWith(' ')) text += ' ';
          text += r.str;
          end = r.x + r.w;
        }
        text = text.replace(/\s+/g, ' ').trim();
        if (text) lines.push(text);
      });
  }
  // Drop our own running footer ("curriculi curricula 1 / 2") and page numbers.
  return lines.filter((l) => !/^curriculi curricula\s+\d+\s*\/\s*\d+$/i.test(l) && !/^\d+\s*\/\s*\d+$/.test(l));
}

// ---- Heading dictionary (en, it, fr, es, de, pt, nl) ----
const HEADINGS: Record<'summary' | 'experience' | 'education' | 'skills' | 'certifications' | 'languages', string[]> = {
  summary: ['summary', 'professional summary', 'profile', 'about', 'about me', 'objective', 'profilo', 'profilo professionale', 'sommario', 'riepilogo', 'chi sono', 'profil', 'profil professionnel', 'a propos', 'à propos', 'perfil', 'perfil profesional', 'perfil profissional', 'resumen', 'resumo', 'sobre mi', 'sobre mí', 'sobre mim', 'uber mich', 'über mich', 'kurzprofil', 'zusammenfassung', 'profiel', 'samenvatting', 'over mij'],
  experience: ['experience', 'work experience', 'professional experience', 'employment', 'employment history', 'work history', 'career', 'esperienza', 'esperienze', 'esperienza lavorativa', 'esperienze professionali', 'esperienza professionale', 'experience professionnelle', 'expérience', 'expériences', 'expérience professionnelle', 'experiencia', 'experiencia laboral', 'experiencia profesional', 'berufserfahrung', 'erfahrung', 'beruflicher werdegang', 'experiência', 'experiência profissional', 'werkervaring', 'ervaring'],
  education: ['education', 'academic background', 'studies', 'istruzione', 'formazione', 'formation', 'éducation', 'études', 'educación', 'formación', 'ausbildung', 'bildung', 'studium', 'educação', 'formação', 'formação académica', 'opleiding', 'opleidingen'],
  skills: ['skills', 'core skills', 'key skills', 'technical skills', 'competencies', 'competences', 'tools', 'stack & tools', 'competenze', 'competenze chiave', 'abilità', 'compétences', 'compétences clés', 'habilidades', 'competencias', 'kenntnisse', 'fähigkeiten', 'kompetenzen', 'kernkompetenzen', 'competências', 'vaardigheden', 'kernvaardigheden'],
  certifications: ['certifications', 'certificates', 'licenses', 'licences', 'certificazioni', 'certificati', 'certificats', 'certificaciones', 'zertifikate', 'zertifizierungen', 'certificações', 'certificaten'],
  languages: ['languages', 'lingue', 'langues', 'idiomas', 'sprachen', 'línguas', 'talen'],
};
type Section = keyof typeof HEADINGS;
const normHead = (s: string) => s.toLowerCase().replace(/[0-9:•·|]/g, '').replace(/\s+/g, ' ').trim();
function headingOf(line: string): Section | null {
  if (line.length > 42) return null;
  const n = normHead(line);
  for (const [section, words] of Object.entries(HEADINGS) as [Section, string[]][]) {
    if (words.includes(n)) return section;
  }
  return null;
}

const PRESENT = "present|current|now|today|presente|attuale|oggi|aujourd'hui|aujourd’hui|actuel|actualidad|actual|heute|aktuell|atual|heden";
// Month names (any length, as a whole word) in en, it, fr, es, de, pt, nl.
const MONTH = String.raw`(?<!\p{L})(?:jan|feb|mar|apr|may|jun|jul|aug|sep|oct|nov|dec|gen|mag|giu|lug|ago|set|ott|dic|janv|févr|fév|avr|mai|juin|juil|août|déc|ene|abr|jän|mär|okt|dez|fev|out|mrt|mei)\p{L}*\.?`;
const DATE = String.raw`(?:${MONTH}\s+)?(?:19|20)\d{2}|\d{1,2}[/.](?:19|20)\d{2}`;
const RANGE_RE = new RegExp(String.raw`(${DATE})\s*(?:[–—-]|to|a|à|bis|tot|al)\s*(${DATE}|(?:${PRESENT})(?![\p{L}]))`, 'iu');
const SINGLE_YEAR_RE = /\b(19|20)\d{2}\b/;
const BULLET_RE = /^[•\-–—*▪●◦]\s*/;
const EMAIL_RE = /[^\s@|·]+@[^\s@|·]+\.[^\s@|·]+/;
const PHONE_RE = /\+?\d[\d\s().-]{7,}\d/;
const URL_RE = /(?:https?:\/\/)?(?:www\.)?[a-z0-9-]+(?:\.[a-z0-9-]+)+(?:\/[^\s|·]*)?/i;
const TYPE_RE = /^(full[- ]?time|part[- ]?time|freelance|contract|internship|volunteer|tempo pieno|part-time|cdi|cdd|jornada completa|vollzeit|teilzeit|freiberuflich|tempo inteiro|fulltime|parttime)$/i;

/** Splits a "Company · City, Country · Full-time" style line. */
function splitMeta(line: string) {
  const parts = line.split(/\s*[|·•]\s*/).map((p) => p.trim()).filter(Boolean);
  const out = { company: '', location: '', employmentType: '' };
  for (const p of parts) {
    if (TYPE_RE.test(p)) out.employmentType = p;
    else if (!out.company) out.company = p;
    else if (!out.location) out.location = p;
  }
  return out;
}

function parseExperience(lines: string[]): Experience[] {
  const roles: Experience[] = [];
  let current: Experience | null = null;
  let expectMeta = false;
  lines.forEach((line, i) => {
    const range = line.match(RANGE_RE);
    if (range) {
      const title = line.replace(range[0], '').replace(/[|·,–-]\s*$/, '').trim() || (i > 0 && !BULLET_RE.test(lines[i - 1]) ? lines[i - 1] : '');
      // If the title came from the previous line, it was wrongly added as a bullet/meta: remove it.
      if (current && title === lines[i - 1] && current.bullets.at(-1) === title) current.bullets.pop();
      current = { id: newId(), title, company: '', location: '', employmentType: '', start: range[1].trim(), end: range[2].trim(), bullets: [] };
      roles.push(current);
      expectMeta = true;
      return;
    }
    if (!current) return;
    if (BULLET_RE.test(line)) {
      current.bullets.push(line.replace(BULLET_RE, '').trim());
      expectMeta = false;
    } else if (expectMeta) {
      Object.assign(current, splitMeta(line));
      expectMeta = false;
    } else if (current.bullets.length && !/[.!?;:]$/.test(current.bullets[current.bullets.length - 1])) {
      // The previous bullet wrapped onto this line.
      current.bullets[current.bullets.length - 1] += ` ${line}`;
    } else {
      current.bullets.push(line);
    }
  });
  return roles;
}

const splitList = (text: string) =>
  text
    .replace(/^[^:]{1,30}:\s*/, '')
    .split(/\s*[,;|•·]\s*/)
    .map((s) => s.trim())
    .filter((s) => s && s.length < 60);

export async function importPdf(file: File): Promise<{ cv: CVData; exact: boolean }> {
  let doc;
  try {
    const pdfjs = await loadPdfJs();
    doc = await pdfjs.getDocument({ data: new Uint8Array(await file.arrayBuffer()) }).promise;
  } catch {
    throw new PdfImportError('unreadable');
  }

  // 1. Our own PDFs: the exact CV is in the XMP metadata.
  try {
    const meta = await doc.getMetadata();
    const raw = (meta.metadata as { getAll?: () => Record<string, string>; getRaw?: () => string } | null);
    const payload = raw?.getAll?.()['jspdf:metadata'];
    if (payload && raw?.getRaw?.().includes(PDF_DATA_NS)) return { cv: await unpackCV(payload.trim()), exact: true };
  } catch {
    // Not ours, or damaged: fall back to reading the text.
  }

  // 2. Any other PDF: read the text and split it into sections.
  const lines = await readLines(doc);
  if (lines.length < 3) throw new PdfImportError('no-text');

  const cv: CVData = structuredClone(blankCV);
  const buckets: Record<Section | 'header', string[]> = { header: [], summary: [], experience: [], education: [], skills: [], certifications: [], languages: [] };
  let section: Section | 'header' = 'header';
  for (const line of lines) {
    const h = headingOf(line);
    if (h) section = h;
    else buckets[section].push(line);
  }

  // Header: name, headline, contact details.
  const header = buckets.header.filter((l) => !/^(cv|curriculum vitae|resume|résumé|lebenslauf)$/i.test(l));
  const contactBits: string[] = [];
  const plain: string[] = [];
  for (const l of header) {
    if (EMAIL_RE.test(l) || PHONE_RE.test(l) || /linkedin\.com/i.test(l) || l.split(/[|·•]/).length > 2) contactBits.push(...l.split(/\s*[|·•]\s*/));
    else plain.push(l);
  }
  cv.profile.name = plain[0] ?? '';
  cv.profile.headline = plain[1] ?? '';
  for (const bit of contactBits.map((b) => b.trim()).filter(Boolean)) {
    const email = bit.match(EMAIL_RE)?.[0];
    if (email && !cv.profile.email) cv.profile.email = email;
    else if (/linkedin\.com/i.test(bit)) cv.profile.linkedin = bit.match(URL_RE)?.[0] ?? bit;
    else if (PHONE_RE.test(bit) && !SINGLE_YEAR_RE.test(bit.replace(PHONE_RE, '')) && !cv.profile.phone) cv.profile.phone = bit.match(PHONE_RE)![0].trim();
    else if (URL_RE.test(bit) && !bit.includes(' ') && !cv.profile.website) cv.profile.website = bit;
    else if (/\p{L}+,\s*\p{L}+/u.test(bit) && !cv.profile.location) cv.profile.location = bit;
  }
  // Extra header lines after name/headline usually belong to the summary.
  if (!buckets.summary.length && plain.length > 2) buckets.summary.push(...plain.slice(2));

  cv.summary = buckets.summary.join(' ').replace(/\s+/g, ' ').trim();
  cv.experience = parseExperience(buckets.experience);

  // Skills: "Core skills: a, b" and "Tools: x, y" lines, or plain lists.
  for (const l of buckets.skills) {
    if (/^(tools|strumenti|outils|herramientas|ferramentas|stack)\b/i.test(l)) {
      cv.tools.push(...splitList(l).map((name) => ({ id: newId(), name, description: '' })));
    } else cv.skills.push(...splitList(l));
  }
  cv.skills = [...new Set(cv.skills)];

  // Education: a line with dates starts an entry; the next line is the school.
  for (let i = 0; i < buckets.education.length; i++) {
    const l = buckets.education[i];
    const range = l.match(RANGE_RE);
    const year = range ? null : l.match(SINGLE_YEAR_RE);
    const degree = l.replace(range?.[0] ?? '', '').trim();
    const next = buckets.education[i + 1];
    const nextIsHeaderLike = next && !RANGE_RE.test(next);
    cv.education.push({
      id: newId(),
      degree: degree.replace(year?.[0] ?? '', '').replace(/[|·,–-]\s*$/, '').trim(),
      school: nextIsHeaderLike ? splitMeta(next).company : '',
      location: nextIsHeaderLike ? splitMeta(next).location : '',
      start: range?.[1] ?? '',
      end: range?.[2] ?? year?.[0] ?? '',
      details: '',
    });
    if (nextIsHeaderLike) i++;
  }

  cv.certifications = buckets.certifications.map((l) => {
    const text = l.replace(BULLET_RE, '');
    const year = text.match(SINGLE_YEAR_RE)?.[0] ?? '';
    const [title, ...rest] = text.replace(year, '').split(/\s*,\s*/).filter(Boolean);
    return { id: newId(), title: title?.replace(/\s*\(.*\)$/, '') ?? text, description: title?.match(/\((.*)\)$/)?.[1] ?? '', issuer: rest.join(', '), year };
  });

  cv.languages = buckets.languages.flatMap((l) => splitList(l)).map((item) => {
    const m = item.match(/^(.+?)\s*(?:\((.+)\)|[–:-]\s*(.+))$/);
    return { id: newId(), name: (m?.[1] ?? item).trim(), level: (m?.[2] ?? m?.[3] ?? '').trim() };
  });

  // Nothing recognised as sections: keep the text in the summary so nothing is lost.
  if (!cv.summary && !cv.experience.length && !cv.skills.length) cv.summary = lines.slice(2).join(' ');

  // Official logos for recognised tools.
  await Promise.all(cv.tools.map(async (t) => (t.icon = (await findIcon(t.name).catch(() => undefined))?.dataUrl)));

  return { cv, exact: false };
}
