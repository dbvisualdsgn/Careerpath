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
  // Drop our own running footer ("curriculi curricula 1 / 2") and page numbers ("2 / 3", "Page 2 of 3").
  return lines.filter(
    (l) =>
      l.text &&
      !/^curriculi\s*curricula\b/i.test(l.text) &&
      !/^\d+\s*\/\s*\d+$/.test(l.text) &&
      !/^(?:page|pagina|página|seite)\s+\d+\s+(?:of|di|sur|de|von|van)\s+\d+$/i.test(l.text),
  );
}

// ---- Heading dictionary (en, it, fr, es, de, pt, nl) ----
const HEADINGS = {
  summary: ['summary', 'professional summary', 'career summary', 'career objective', 'career profile', 'career goal', 'career goals', 'profile', 'professional profile', 'personal statement', 'about', 'about me', 'objective', 'profilo', 'profilo professionale', 'presentazione', 'sommario', 'riepilogo', 'chi sono', 'profil', 'profil professionnel', 'profil personnel', 'a propos', 'à propos', 'à propos de moi', 'perfil', 'perfil profesional', 'perfil profissional', 'extracto', 'resumen', 'resumo', 'resumo profissional', 'sobre mi', 'sobre mí', 'sobre mim', 'uber mich', 'über mich', 'kurzprofil', 'persönliches profil', 'zusammenfassung', 'profiel', 'samenvatting', 'over mij'],
  experience: ['experience', 'experiences', 'work experience', 'work experiences', 'professional experience', 'professional experiences', 'selected experience', 'employment', 'employment history', 'work history', 'career history', 'esperienza', 'esperienze', 'esperienza lavorativa', 'esperienze lavorative', 'esperienze professionali', 'esperienza professionale', 'experience professionnelle', 'expérience', 'expériences', 'expérience professionnelle', 'expériences professionnelles', 'parcours professionnel', 'experiencia', 'experiencias', 'experiencia laboral', 'experiencia profesional', 'trayectoria profesional', 'berufserfahrung', 'erfahrung', 'berufliche erfahrung', 'beruflicher werdegang', 'praxiserfahrung', 'experiência', 'experiências', 'experiência profissional', 'percurso profissional', 'werkervaring', 'werkervaringen', 'ervaring', 'loopbaan'],
  education: ['education', 'education & training', 'education and training', 'academic background', 'studies', 'istruzione', 'istruzione e formazione', 'formazione', 'titoli di studio', 'formation', 'formations', 'formation & diplômes', 'diplômes', 'éducation', 'études', 'educación', 'formación', 'formación académica', 'estudios', 'ausbildung', 'bildung', 'bildungsweg', 'studium', 'educação', 'formação', 'formação académica', 'formação acadêmica', 'opleiding', 'opleidingen'],
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

// Words that name a section, wherever they sit in a short heading ("Relevant Experience", "Top Skills",
// "Skills & Tools", "Languages spoken"). The earliest word in the line decides.
const KEYWORDS: [Bucket, RegExp][] = [
  ['header', /contact|contatt|coordonn|kontakt|personal (?:details|info)|dati personali|datos personales|persönliche daten|dados pessoais|persoonlijke gegevens/i],
  ['languages', /language|lingue|langues|idiom|sprache|línguas|\btalen/i],
  ['certifications', /certif|zertifi|licen[cs]e/i],
  ['tools', /\btools?\b|software|\bstack\b|strumenti|outils|herramientas|ferramentas|werkzeuge/i],
  ['skills', /skill|competen|compéten|habilidad|kenntnis|fähigkeit|kompetenz|vaardighe|expertise|abilità/i],
  ['education', /educat|istruzione|formazione|formation|formación|formação|ausbildung|bildung|studies|studium|études|estudios|opleiding|academic|diplom/i],
  ['experience', /experien|esperienz|erfahrung|ervaring|employment|work history|career|carriera|parcours|trayectoria|werdegang|loopbaan|percurso/i],
  ['summary', /summary|profil|about|objective|sommario|riepilogo|presentazione|resumen|resumo|samenvatting|über mich|chi sono|propos/i],
  ['other', /interest|hobb|referen|interess|intérêt|volunteer|volontariato|bénévolat|voluntariado|ehrenamt|vrijwilliger|award|publication/i],
];

/** A short line set like a heading (capitals, bigger than the body text, or ending in ":") that names a section. */
function looseHeadingOf(line: PdfLine, bodySize: number): Bucket | null {
  const text = line.text.replace(/^\d{1,2}\s*[.)—–-]?\s*/, '').trim();
  if (!text || text.length > 40 || text.split(/\s+/).length > 5 || /[\d@]|[.,;]$/.test(text)) return null;
  const letters = text.replace(/[^\p{L}]/gu, '');
  const styled = (letters.length > 2 && letters === letters.toUpperCase()) || line.size >= bodySize * 1.12 || text.endsWith(':');
  if (!styled) return null;
  let best: { bucket: Bucket; at: number } | null = null;
  let keywordWords = 0;
  for (const [bucket, re] of KEYWORDS) {
    const at = text.search(re);
    if (at < 0) continue;
    keywordWords++;
    if (!best || at < best.at) best = { bucket, at };
  }
  // A heading is the section word plus at most one more ("Relevant Experience", "Skills & Tools");
  // "Senior Software Engineer" names a job, not a section.
  const extra = text.split(/\s+/).filter((w) => /\p{L}{3,}/u.test(w)).length - keywordWords;
  return best && extra <= 1 ? best.bucket : null;
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

/** A line that is only a date range ("Mar 2023 – Present", "2019 – 2021 ·"), with nothing else on it. */
function onlyDates(text: string) {
  const m = text.match(RANGE_RE);
  return Boolean(m) && !text.replace(m![0], '').replace(/[|·,–(-]/g, '').trim();
}

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

// "(1 year 8 months)", "· 3 yrs", "(2 anni)": the length of a role, added by LinkedIn and others.
const DURATION_RE = /[(·]?\s*\d+\s*(?:years?|yrs?|months?|mos?|anni|anno|mesi|mese|ans?|mois|años?|meses?|jahre?|monate?|jaar|maanden?)\b[^)·]*\)?/giu;
const isSentence = (s: string) => /[.!?;:]$/.test(s);

function parseExperience(lines: string[]): Experience[] {
  // Durations are only stripped from date lines, so "3 years" inside a description stays.
  const clean = lines.map((l) => (RANGE_RE.test(l) ? l.replace(DURATION_RE, '').replace(/\s*[(·]\s*$/, '').trim() : l));
  const dateOnly = (i: number) => Boolean(clean[i]) && onlyDates(clean[i]);
  const plain = (i: number) => i >= 0 && i < clean.length && !BULLET_RE.test(clean[i]) && !RANGE_RE.test(clean[i]);
  // A dates-only line takes its title from the line above. When the first one has exactly a title and one more
  // line above it, that line is the company (LinkedIn: company, title, dates, place), and so for every role.
  const dated = clean.map((_, i) => i).filter(dateOnly);
  // Dates first: the section opens with a dates-only line, so each title comes on the line below its dates.
  const datesFirst = dated[0] === 0;
  const companyAbove =
    !datesFirst &&
    dated[0] === 2 && plain(0) && plain(1) && clean[0].length <= 60 && !isSentence(clean[0]) && !/[|·•]/.test(clean[3] ?? '|');
  const role = new Map<number, 'title' | 'company'>();
  let prev = -Infinity;
  for (const j of datesFirst ? [] : dated) {
    if (!plain(j - 1)) continue;
    role.set(j - 1, 'title');
    // Right after the previous role's place line, there is no company: it is another role at the same one.
    if (companyAbove && j - 2 !== prev + 1 && plain(j - 2) && !role.has(j - 2) && clean[j - 2].length <= 60) role.set(j - 2, 'company');
    prev = j;
  }

  const roles: Experience[] = [];
  let current: Experience | null = null;
  let expectMeta = false;
  let expectTitle = false;
  clean.forEach((line, i) => {
    if (role.has(i)) return;
    const range = line.match(RANGE_RE);
    if (range) {
      // A lone capital before the title is a logo's initial (e.g. "K Senior UX Researcher").
      const inline = line.replace(range[0], '').replace(/[|·,–-]\s*$/, '').trim().replace(/^\p{Lu}(?:\s·)?\s+(?=\p{Lu})/u, '');
      const title = inline || (role.get(i - 1) === 'title' ? clean[i - 1] : '');
      // LinkedIn groups several roles under one company name: those roles keep it.
      const company = !inline && role.get(i - 2) === 'company' ? clean[i - 2] : companyAbove && !inline ? (current?.company ?? '') : '';
      current = { id: newId(), title, company, location: '', employmentType: '', start: range[1].trim(), end: range[2].trim(), bullets: [] };
      roles.push(current);
      expectTitle = datesFirst && !title;
      expectMeta = !expectTitle;
      return;
    }
    if (!current) return;
    if (expectTitle && !BULLET_RE.test(line)) {
      current.title = line;
      expectTitle = false;
      expectMeta = true;
      return;
    }
    if (BULLET_RE.test(line)) {
      current.bullets.push(line.replace(BULLET_RE, '').trim());
      expectMeta = false;
      expectTitle = false;
    } else if (expectMeta) {
      const meta = splitMeta(line);
      // The company is known already (it came above the title): this line is the place.
      if (current.company) Object.assign(current, { location: [meta.company, meta.location].filter(Boolean).join(', '), employmentType: meta.employmentType });
      else Object.assign(current, meta);
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

const DEGREE_RE = /\b(?:master|bachelor|degree|msc|ma|ba|bsc|mba|phd|laurea|diploma|diplôme|licence|licenciatura|grado|máster|mestrado|bacharelado|abitur|studium|bts|dut|hnd|certificate)\b|\b(?:doctora|dottorato|baccalaur|bachiller)\p{L}*/iu;

/** Education entries: degree, then school, with dates on either line or on their own line. */
function parseEducation(lines: string[]) {
  const out: CVData['education'] = [];
  let cur: CVData['education'][number] | null = null;
  let pending: [string, string] | null = null;
  for (const line of lines.map((l) => l.replace(BULLET_RE, ''))) {
    const range = line.match(RANGE_RE);
    const year = range ? null : line.match(SINGLE_YEAR_RE);
    const dated = Boolean(range || year);
    const rest = line
      .replace(range?.[0] ?? year?.[0] ?? '', '')
      .replace(/\(\s*\)/g, '')
      .replace(/^[|·,–(-]\s*|\s*[|·,–(-]\s*$/g, '')
      .trim();
    // Dates on their own line before the degree (dates-first layouts): keep them for the entry that follows.
    if (!rest && dated && (!cur || (cur.degree && (cur.start || cur.end)))) {
      pending = range ? [range[1].trim(), range[2].trim()] : ['', year![0]];
      continue;
    }
    if (rest && (!cur || (cur.degree && cur.school) || (dated && cur.degree && (cur.start || cur.end)) || pending)) {
      cur = { id: newId(), degree: '', school: '', location: '', start: pending?.[0] ?? '', end: pending?.[1] ?? '', details: '' };
      out.push(cur);
      pending = null;
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
  // School first, degree second (LinkedIn): swap when only the second line names a degree.
  for (const e of out) if (e.school && !DEGREE_RE.test(e.degree) && DEGREE_RE.test(e.school)) [e.degree, e.school] = [e.school, e.degree];
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
  const sizes = lines.map((l) => l.size).sort((a, b) => a - b);
  const bodySize = sizes[Math.floor(sizes.length / 2)] ?? 10;
  const seen = new Set<Bucket>();
  // The size of headings already found word for word: a loose heading followed by dates must match it.
  let headingSize = 0;
  lines.forEach((line, i) => {
    // The name opens the header, also when a sidebar was read before it (LinkedIn).
    if (line === name) return void (bucket = 'header');
    // A loose heading names a section not seen yet, and is not a job title followed by its dates.
    const loose = () => {
      // The line under the name is the headline, whatever words it holds.
      if (lines[i - 1] === name) return null;
      const b = looseHeadingOf(line, bodySize);
      // A job title followed by its dates is not a heading, unless it is set exactly like the headings.
      const nextIsDates = onlyDates(lines[i + 1]?.text ?? '');
      const asHeading = headingSize > 0 && Math.abs(line.size - headingSize) < 0.5;
      return b && !seen.has(b) && (!nextIsDates || asHeading) ? b : null;
    };
    const exact = headingOf(line.text);
    if (exact) headingSize ||= line.size;
    const h = exact ?? loose();
    if (h) {
      bucket = h;
      seen.add(h);
    } else buckets[bucket].push(line.text);
  });

  // Header: name, headline, contact details. Other lines there usually belong to the summary.
  const header = buckets.header.filter((l) => !/^(cv|curriculum vitae|resume|résumé|lebenslauf)$/i.test(l));
  const plain: string[] = [];
  // The current header line holds several contact details ("email · phone · city").
  let among = false;
  const contact = (bit: string) => {
    const email = bit.match(EMAIL_RE)?.[0];
    if (email) return void (cv.profile.email ||= email);
    if (/linkedin\.com/i.test(bit)) return void (cv.profile.linkedin ||= bit.match(URL_RE)?.[0] ?? bit);
    if (PHONE_RE.test(bit) && !SINGLE_YEAR_RE.test(bit.replace(PHONE_RE, ''))) return void (cv.profile.phone ||= bit.match(PHONE_RE)![0].trim());
    if (URL_RE.test(bit) && !bit.includes(' ')) return void (cv.profile.website ||= bit);
    if (/^[\p{L}' .-]+,\s*[\p{L}' .-]+$/u.test(bit) && bit.length <= 40) return void (cv.profile.location ||= bit);
    // "Paris, Île-de-France, France": only after the headline, or next to other contact details,
    // so a headline like "Designer, Researcher, Writer" stays the headline.
    if (/^[\p{L}' .-]+(?:,\s*[\p{L}' .-]+){2}$/u.test(bit) && bit.length <= 48 && (plain.length > 0 || among)) return void (cv.profile.location ||= bit);
    return false;
  };
  for (const l of header) {
    const bits = l.split(/\s*[|·•]\s*/).map((b) => b.trim()).filter(Boolean);
    among = bits.length > 1;
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
