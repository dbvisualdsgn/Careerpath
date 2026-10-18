// Fills a CV from a PDF. PDFs made here carry the exact CV in their metadata and come back 1:1.
// Any other PDF is read as text and split into sections with multilingual heading and date rules.
import { blankCV, newId } from './defaultCV';
import { LEGACY_PDF_DATA_NS, PDF_DATA_NS, unpackCV } from './share';
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

/** One line of text as read from the page, with its largest font size. */
export interface PdfLine {
  text: string;
  size: number;
  page: number;
}

interface Item {
  x: number;
  y: number;
  w: number;
  size: number;
  str: string;
}

// "P R O F I L E" (letter-spaced headings, common in designed CVs) reads back as "PROFILE".
const unspace = (t: string) =>
  /^(?:[\p{L}\p{N}]\s)+[\p{L}\p{N}]$/u.test(t.replace(/\s{2,}/g, ' ')) ? t.split(/\s{2,}/).map((w) => w.replace(/\s/g, '')).join(' ') : t;

/** Joins items that share a line: same baseline, or a smaller date set a little higher next to a big title. */
function rowsOf(items: Item[], page: number): PdfLine[] {
  const sorted = [...items].sort((a, b) => b.y - a.y || a.x - b.x);
  // Two items share a line when their glyph boxes (descender to cap height) overlap by a third.
  const box = (i: Item) => [i.y - i.size * 0.2, i.y + i.size * 0.75];
  const together = (a: Item, b: Item) => {
    const [a0, a1] = box(a);
    const [b0, b1] = box(b);
    return Math.min(a1, b1) - Math.max(a0, b0) > Math.min(a1 - a0, b1 - b0) * 0.33;
  };
  const rows: { size: number; items: Item[] }[] = [];
  for (const it of sorted) {
    const row = rows.at(-1);
    if (row && row.items.some((r) => together(r, it))) {
      row.items.push(it);
      row.size = Math.max(row.size, it.size);
    } else rows.push({ size: it.size, items: [it] });
  }
  return rows.map((row) => {
    row.items.sort((a, b) => a.x - b.x);
    // Pieces of one word sit edge to edge; only add a space where there is a visible gap.
    let text = '';
    let end = -Infinity;
    for (const r of row.items) {
      const gap = r.x - end;
      // A wide gap separates things set apart on the line (pills, a right-aligned date): mark it.
      if (text && gap > r.size * 1.5) text = `${text.trimEnd()} · `;
      else if (text && gap > r.size * 0.18 && !text.endsWith(' ') && !r.str.startsWith(' ')) text += ' ';
      text += r.str;
      end = r.x + r.w;
    }
    return { text: text.trim().split(' · ').map(unspace).join(' · ').replace(/\s+/g, ' ').trim(), size: row.size, page };
  });
}

const isDateOnly = (s: string) => /^[\p{L}.]*\s*(?:19|20)\d{2}\s*(?:[–—-]\s*[\p{L}.]*\s*(?:(?:19|20)\d{2})?[\p{L}’']*)?$/iu.test(s.trim());

/**
 * Two-column CVs: finds an empty vertical gutter with real text on both sides and reads each column
 * top to bottom (the column with the topmost line first). Lines that cross the gutter stay in place
 * above or below the columns. A column of right-aligned dates is not a column.
 */
function columnsOf(items: Item[]): Item[][] {
  if (items.length < 12) return [items];
  const minX = Math.min(...items.map((i) => i.x));
  const maxX = Math.max(...items.map((i) => i.x + i.w));
  const width = maxX - minX;
  const step = 2;
  const cover = new Array(Math.ceil(width / step) + 1).fill(0);
  for (const it of items) for (let x = it.x; x < it.x + it.w; x += step) cover[Math.floor((x - minX) / step)]++;
  // Widest empty band whose middle sits between 15% and 85% of the text area.
  let best = { from: 0, to: 0 };
  let start = -1;
  const central = (from: number, to: number) => {
    const mid = ((from + to) / 2) * step;
    return mid > width * 0.15 && mid < width * 0.85;
  };
  cover.forEach((c, i) => {
    if (c === 0 && start < 0) start = i;
    if ((c !== 0 || i === cover.length - 1) && start >= 0) {
      if (i - start > best.to - best.from && central(start, i)) best = { from: start, to: i };
      start = -1;
    }
  });
  const gutter = minX + ((best.from + best.to) / 2) * step;
  if ((best.to - best.from) * step < 12) return [items];
  const left = items.filter((i) => i.x + i.w <= gutter);
  const right = items.filter((i) => i.x >= gutter);
  const real = (side: Item[]) => side.filter((i) => !isDateOnly(i.str)).length;
  if (real(left) < 4 || real(right) < 4) return [items];
  const top = (side: Item[]) => Math.max(...side.map((i) => i.y));
  return top(left) >= top(right) ? [left, right] : [right, left];
}

/** Text lines in reading order, page by page and column by column. */
export async function readLines(doc: { numPages: number; getPage: (n: number) => Promise<any> }): Promise<PdfLine[]> {
  const lines: PdfLine[] = [];
  for (let n = 1; n <= doc.numPages; n++) {
    const page = await doc.getPage(n);
    const content = await page.getTextContent();
    const items: Item[] = (content.items as { str: string; transform: number[]; width: number }[])
      .filter((i) => i.str && i.str.trim())
      .map((i) => ({ x: i.transform[4], y: i.transform[5], w: i.width ?? 0, size: Math.abs(i.transform[0]) || 10, str: i.str }));
    for (const column of columnsOf(items)) lines.push(...rowsOf(column, n));
  }
  // Drop our own running footer ("curriculi curricula 1 / 2") and page numbers.
  return lines.filter((l) => l.text && !/^curriculi\s*curricula\b/i.test(l.text) && !/^\d+\s*\/\s*\d+$/.test(l.text));
}

// ---- Heading dictionary (en, it, fr, es, de, pt, nl) ----
const HEADINGS = {
  summary: ['summary', 'professional summary', 'career summary', 'profile', 'professional profile', 'personal statement', 'about', 'about me', 'objective', 'profilo', 'profilo professionale', 'presentazione', 'sommario', 'riepilogo', 'chi sono', 'profil', 'profil professionnel', 'profil personnel', 'a propos', 'à propos', 'à propos de moi', 'perfil', 'perfil profesional', 'perfil profissional', 'extracto', 'resumen', 'resumo', 'resumo profissional', 'sobre mi', 'sobre mí', 'sobre mim', 'uber mich', 'über mich', 'kurzprofil', 'persönliches profil', 'zusammenfassung', 'profiel', 'samenvatting', 'over mij'],
  experience: ['experience', 'experiences', 'work experience', 'work experiences', 'professional experience', 'professional experiences', 'selected experience', 'employment', 'employment history', 'work history', 'career history', 'esperienza', 'esperienze', 'esperienza lavorativa', 'esperienze lavorative', 'esperienze professionali', 'esperienza professionale', 'experience professionnelle', 'expérience', 'expériences', 'expérience professionnelle', 'expériences professionnelles', 'parcours professionnel', 'experiencia', 'experiencias', 'experiencia laboral', 'experiencia profesional', 'trayectoria profesional', 'berufserfahrung', 'erfahrung', 'berufliche erfahrung', 'beruflicher werdegang', 'praxiserfahrung', 'experiência', 'experiências', 'experiência profissional', 'percurso profissional', 'werkervaring', 'werkervaringen', 'ervaring', 'loopbaan'],
  education: ['education', 'education & training', 'education and training', 'academic background', 'studies', 'istruzione', 'istruzione e formazione', 'formazione', 'titoli di studio', 'formation', 'formations', 'formation & diplômes', 'diplômes', 'éducation', 'études', 'educación', 'formación', 'estudios', 'ausbildung', 'bildung', 'bildungsweg', 'studium', 'educação', 'formação', 'formação académica', 'formação acadêmica', 'opleiding', 'opleidingen'],
  skills: ['skills', 'core skills', 'key skills', 'technical skills', 'soft skills', 'hard skills', 'skills & expertise', 'expertise', 'competencies', 'competences', 'competenze', 'competenze chiave', 'competenze tecniche', 'competenze trasversali', 'abilità', 'compétences', 'compétences clés', 'savoir-faire', 'habilidades', 'competencias', 'aptitudes', 'kenntnisse', 'fähigkeiten', 'fertigkeiten', 'kompetenzen', 'kernkompetenzen', 'competências', 'vaardigheden', 'kernvaardigheden'],
  tools: ['tools', 'stack & tools', 'tools & software', 'tech stack', 'strumenti', 'software e strumenti', 'outils', 'logiciels', 'herramientas', 'ferramentas', 'werkzeuge', 'tools en software'],
  certifications: ['certifications', 'certificates', 'licenses', 'licences', 'certificazioni', 'certificati', 'certificats', 'certificaciones', 'zertifikate', 'zertifizierungen', 'certificações', 'certificaten'],
  languages: ['languages', 'language skills', 'lingue', 'lingue straniere', 'conoscenze linguistiche', 'langues', 'compétences linguistiques', 'idiomas', 'sprachen', 'sprachkenntnisse', 'línguas', 'talen', 'talenkennis'],
  // Contact blocks belong to the header; the rest is not part of this CV's sections and is left out.
  header: ['contact', 'contacts', 'contact details', 'contact info', 'personal details', 'contatti', 'contatto', 'dati personali', 'coordonnées', 'informations personnelles', 'contacto', 'datos personales', 'kontakt', 'persönliche daten', 'contato', 'contactos', 'dados pessoais', 'contactgegevens', 'persoonlijke gegevens'],
  other: ['interests', 'hobbies', 'interessi', 'centres d’intérêt', "centres d'intérêt", 'intereses', 'hobbys', 'interesses', 'hobby’s', 'references', 'referenze', 'références', 'referencias', 'referenzen', 'referências', 'referenties'],
};
type Bucket = keyof typeof HEADINGS;
const tight = (s: string) => s.toLowerCase().replace(/[^\p{L}&]/gu, '');
const HEADING_INDEX = new Map(Object.entries(HEADINGS).flatMap(([b, words]) => words.map((w) => [tight(w), b as Bucket] as const)));
function headingOf(line: string): Bucket | null {
  if (line.length > 48) return null;
  return HEADING_INDEX.get(tight(line)) ?? null;
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
      // A lone capital before the title is a logo's initial (e.g. "K Senior UX Researcher").
      const title = line.replace(range[0], '').replace(/[|·,–-]\s*$/, '').trim().replace(/^\p{Lu}(?:\s·)?\s+(?=\p{Lu})/u, '') || (i > 0 && !BULLET_RE.test(lines[i - 1]) ? lines[i - 1] : '');
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

/** The name: the biggest short line on the first page, when it clearly stands out. */
function nameLine(lines: PdfLine[]) {
  const first = lines.filter((l) => l.page === 1);
  const sizes = first.map((l) => l.size).sort((a, b) => a - b);
  const median = sizes[Math.floor(sizes.length / 2)] ?? 0;
  const candidates = first.filter((l) => l.text.length <= 40 && !/[\d@/]/.test(l.text) && !headingOf(l.text));
  const big = candidates.sort((a, b) => b.size - a.size)[0];
  return big && big.size >= median * 1.4 ? big : undefined;
}

/** Education entries: degree, then school, with dates on either line or on their own line. */
function parseEducation(lines: string[]) {
  const out: CVData['education'] = [];
  let cur: CVData['education'][number] | null = null;
  for (const line of lines.map((l) => l.replace(BULLET_RE, ''))) {
    const range = line.match(RANGE_RE);
    const year = range ? null : line.match(SINGLE_YEAR_RE);
    const dated = Boolean(range || year);
    const rest = line.replace(range?.[0] ?? year?.[0] ?? '', '').replace(/^[|·,–-]\s*|\s*[|·,–-]\s*$/g, '').trim();
    if (rest && (!cur || (cur.degree && cur.school) || (dated && cur.degree && (cur.start || cur.end)))) {
      cur = { id: newId(), degree: '', school: '', location: '', start: '', end: '', details: '' };
      out.push(cur);
    }
    if (!cur) continue;
    if (rest) {
      if (!cur.degree) cur.degree = rest;
      else {
        const meta = splitMeta(rest);
        cur.school = meta.company;
        cur.location = meta.location;
      }
    }
    if (range) [cur.start, cur.end] = [range[1].trim(), range[2].trim()];
    else if (year && !cur.end) cur.end = year[0];
  }
  return out;
}

const LEVEL_RE = /^(?:[abc][12]|native|fluent|basic|intermediate|advanced|professional|madrelingua|fluente|base|intermedio|avanzato|natif|langue maternelle|courant|nativo|nativa|lengua materna|fluido|muttersprache|fließend|grundkenntnisse|moedertaal|vloeiend)\b/i;
// "NATIVE" → "Native"; CEFR codes stay as they are.
const levelCase = (s: string) => (/^[ABC][12]$/i.test(s) ? s.toUpperCase() : s === s.toUpperCase() ? s[0] + s.slice(1).toLowerCase() : s);

/** "Italian (Native), English – C1", one per line, or a grid: names on one line, levels on the next. */
function parseLanguages(lines: string[]) {
  const out: CVData['languages'] = [];
  for (let i = 0; i < lines.length; i++) {
    const items = splitList(lines[i].replace(BULLET_RE, ''));
    const next = lines[i + 1] ? splitList(lines[i + 1]) : [];
    if (items.length > 1 && next.length === items.length && next.every((l) => LEVEL_RE.test(l)) && !items.some((l) => LEVEL_RE.test(l))) {
      items.forEach((name, k) => out.push({ id: newId(), name, level: levelCase(next[k]) }));
      i++;
      continue;
    }
    for (const item of items) {
      const m = item.match(/^(.+?)\s*(?:\((.+)\)|[–:-]\s*(.+))$/);
      out.push({ id: newId(), name: (m?.[1] ?? item).trim(), level: levelCase((m?.[2] ?? m?.[3] ?? '').trim() || ' ').trim() });
    }
  }
  return out;
}

/** Builds a CV from the text lines of any PDF. */
export function parseLines(lines: PdfLine[]): CVData {
  const cv: CVData = structuredClone(blankCV);
  const name = nameLine(lines);
  const buckets: Record<Bucket, string[]> = { header: [], summary: [], experience: [], education: [], skills: [], tools: [], certifications: [], languages: [], other: [] };
  let bucket: Bucket = 'header';
  for (const line of lines) {
    if (line === name) continue;
    const h = headingOf(line.text);
    if (h) bucket = h;
    else buckets[bucket].push(line.text);
  }

  // Header: name, headline, contact details. Other lines there usually belong to the summary.
  const header = buckets.header.filter((l) => !/^(cv|curriculum vitae|resume|résumé|lebenslauf)$/i.test(l));
  const plain: string[] = [];
  const contact = (bit: string) => {
    const email = bit.match(EMAIL_RE)?.[0];
    if (email) return void (cv.profile.email ||= email);
    if (/linkedin\.com/i.test(bit)) return void (cv.profile.linkedin ||= bit.match(URL_RE)?.[0] ?? bit);
    if (PHONE_RE.test(bit) && !SINGLE_YEAR_RE.test(bit.replace(PHONE_RE, ''))) return void (cv.profile.phone ||= bit.match(PHONE_RE)![0].trim());
    if (URL_RE.test(bit) && !bit.includes(' ')) return void (cv.profile.website ||= bit);
    if (/^[\p{L}' .-]+,\s*[\p{L}' .-]+$/u.test(bit) && bit.length <= 40) return void (cv.profile.location ||= bit);
    return false;
  };
  for (const l of header) {
    const bits = l.split(/\s*[|·•]\s*/).map((b) => b.trim()).filter(Boolean);
    const unknown = bits.filter((b) => contact(b) === false);
    if (unknown.length === bits.length) plain.push(l);
  }
  cv.profile.name = name?.text ?? plain.shift() ?? '';
  cv.profile.headline = plain.shift() ?? '';
  if (!buckets.summary.length) buckets.summary.push(...plain);

  cv.summary = buckets.summary.join(' ').replace(/\s+/g, ' ').trim();
  cv.experience = parseExperience(buckets.experience);

  // Skills: "Core skills: a, b" and "Tools: x, y" lines, or plain lists.
  for (const l of buckets.skills) {
    if (/^(tools|strumenti|outils|herramientas|ferramentas|werkzeuge|stack)\b/i.test(l)) {
      cv.tools.push(...splitList(l).map((name) => ({ id: newId(), name, description: '' })));
    } else cv.skills.push(...splitList(l.replace(BULLET_RE, '')));
  }
  for (const l of buckets.tools) cv.tools.push(...splitList(l.replace(BULLET_RE, '')).map((name) => ({ id: newId(), name, description: '' })));
  cv.skills = [...new Set(cv.skills)];

  cv.education = parseEducation(buckets.education);

  cv.certifications = buckets.certifications.map((l) => {
    const text = l.replace(BULLET_RE, '');
    const year = text.match(SINGLE_YEAR_RE)?.[0] ?? '';
    const [title, ...rest] = text.replace(year, '').split(/\s*,\s*/).filter(Boolean);
    return { id: newId(), title: title?.replace(/\s*\(.*\)$/, '') ?? text, description: title?.match(/\((.*)\)$/)?.[1] ?? '', issuer: rest.join(', '), year };
  });

  cv.languages = parseLanguages(buckets.languages);

  // Nothing recognised as sections: keep the text in the summary so nothing is lost.
  if (!cv.summary && !cv.experience.length && !cv.skills.length) cv.summary = lines.slice(2).map((l) => l.text).join(' ');
  return cv;
}

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
    const xmp: string = raw?.getRaw?.() ?? '';
    if (payload && (xmp.includes(PDF_DATA_NS) || xmp.includes(LEGACY_PDF_DATA_NS))) return { cv: await unpackCV(payload.trim()), exact: true };
  } catch {
    // Not ours, or damaged: fall back to reading the text.
  }

  // 2. Any other PDF: read the text and split it into sections.
  const lines = await readLines(doc);
  if (lines.length < 3) throw new PdfImportError('no-text');
  const cv = parseLines(lines);

  // Official logos for recognised tools.
  await Promise.all(cv.tools.map(async (t) => (t.icon = (await findIcon(t.name).catch(() => undefined))?.dataUrl)));

  return { cv, exact: false };
}
