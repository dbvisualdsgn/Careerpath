// Heuristic checks based on common ATS (applicant tracking system) and AI-screening guidance:
// parseable contact details, standard sections, dated roles, achievement-led bullets, keywords.
import type { CVData } from './types';
import type { Messages } from '../i18n/en';
import { stopwordsFor } from './stopwords';

export type Severity = 'error' | 'warning' | 'tip';
type FindingKey = keyof Messages['ats']['findings'];
type PassedKey = keyof Messages['ats']['passed'];
type Params = Record<string, string | number>;

export interface Finding {
  id: string;
  severity: Severity;
  section: 'profile' | 'summary' | 'skills' | 'experience' | 'education' | 'extras';
  key: FindingKey;
  params?: Params;
}

export interface AtsReport {
  score: number;
  findings: Finding[];
  passed: { key: PassedKey; params?: Params }[];
  wordCount: number;
}

const ACTION_VERBS = new Set(
  `accelerated achieved analyzed architected automated boosted built championed coached collaborated conceived conducted
  consolidated created cut defined delivered designed developed directed drove eliminated enabled established evaluated
  expanded facilitated founded generated grew guided headed identified implemented improved increased influenced initiated
  introduced launched led lead managed mapped mentored migrated modernized negotiated optimized orchestrated organized
  overhauled oversaw owned partnered pioneered planned prioritized produced prototyped provide provided redesigned reduced
  refined researched resolved restructured revamped saved scaled shaped shipped simplified spearheaded standardized
  streamlined strengthened supervised supported tested trained transformed unified validated wrote create design build
  deliver develop drive improve manage own run ship scale`
    .split(/\s+/)
    .filter(Boolean),
);

const IRREGULAR_PAST = new Set('led built ran drove wrote grew cut made won set took oversaw began brought taught sold met'.split(' '));

const WEAK_OPENERS = /^(responsible for|worked on|helped|assisted|in charge of|tasked with|duties included|involved in)\b/i;
const CLICHES = [
  'passionate', 'team player', 'hard-working', 'hardworking', 'go-getter', 'results-driven', 'detail-oriented',
  'self-starter', 'think outside the box', 'synergy', 'guru', 'ninja', 'rockstar', 'dynamic', 'motivated individual',
];
const FIRST_PERSON = /\b(i|i'm|i've|me|my|mine)\b/i;
// Month names are matched loosely (any word) so dates in every supported language are accepted.
const DATE_RE = /^(\p{L}{3,}\.?\s+)?(19|20)\d{2}$|^(0?[1-9]|1[0-2])[/.](19|20)\d{2}$/iu;
const MONTH_DATE_RE = /^(\p{L}{3,}\.?\s+(19|20)\d{2}|(0?[1-9]|1[0-2])[/.](19|20)\d{2})$/iu;
const PRESENT_RE = /^(present|current|now|today|presente|attuale|oggi|aujourd'hui|aujourd’hui|actuel|actualidad|actual|heute|aktuell|atual|heden|nu)$/i;
// Matches emoji and pictographs, which many parsers drop or mangle.
const EMOJI_RE = /[\u{1F300}-\u{1FAFF}\u{2600}-\u{27BF}]/u;

const words = (s: string) => s.trim().split(/\s+/).filter(Boolean);

export function allText(cv: CVData) {
  return [
    cv.profile.name, cv.profile.headline, cv.summary, cv.skills.join(' '),
    ...cv.tools.map((t) => `${t.name} ${t.description}`),
    ...cv.experience.map((e) => [e.title, e.company, e.location, ...e.bullets].join(' ')),
    ...cv.education.map((e) => [e.degree, e.school, e.details].join(' ')),
    ...cv.certifications.map((c) => [c.title, c.description, c.issuer].join(' ')),
    ...cv.languages.map((l) => `${l.name} ${l.level}`),
  ].join(' ');
}

export function runAtsCheck(cv: CVData, locale: string = 'en'): AtsReport {
  const findings: Finding[] = [];
  const passed: AtsReport['passed'] = [];
  const add = (severity: Severity, section: Finding['section'], key: FindingKey, params?: Params, id: string = key) =>
    findings.push({ id, severity, section, key, params });
  const pass = (key: PassedKey, params?: Params) => passed.push({ key, params });
  // Verb, tense, pronoun and cliché checks rely on English word lists.
  const english = locale === 'en';
  const { profile } = cv;

  // Contact details: ATS parsers look for these in the document body.
  if (!profile.name.trim()) add('error', 'profile', 'name');
  if (!profile.headline.trim()) add('error', 'profile', 'headline');
  else pass('headline');
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(profile.email.trim())) add('error', 'profile', 'email');
  else pass('email');
  if (!profile.phone.trim()) add('warning', 'profile', 'phone');
  else pass('phone');
  if (!profile.location.trim()) add('warning', 'profile', 'location');
  else pass('location');
  if (!profile.linkedin.trim()) add('tip', 'profile', 'linkedin');

  // Summary.
  const summaryWords = words(cv.summary).length;
  if (summaryWords === 0) add('error', 'summary', 'summary');
  else if (summaryWords < 30) add('warning', 'summary', 'summaryShort', { words: summaryWords });
  else if (summaryWords > 120) add('warning', 'summary', 'summaryLong', { words: summaryWords });
  else pass('summary');
  if (english && FIRST_PERSON.test(cv.summary)) add('tip', 'summary', 'summaryPronoun');
  if (summaryWords > 0 && !/\d/.test(cv.summary)) add('tip', 'summary', 'summaryYears');

  // Skills.
  const skillCount = cv.skills.length + cv.tools.length;
  if (skillCount < 6) add('warning', 'skills', 'skills', { count: skillCount });
  else pass('skills', { count: skillCount });
  if (cv.skills.length === 0) add('warning', 'skills', 'skillsCore');

  // Experience.
  if (cv.experience.length === 0) add('error', 'experience', 'experience');
  let quantified = 0;
  let bulletTotal = 0;
  cv.experience.forEach((exp) => {
    const label = exp.title || exp.company || '';
    const id = (suffix: string) => `exp-${exp.id}-${suffix}`;
    const start = exp.start.trim();
    const end = exp.end.trim();
    const finished = Boolean(end) && !PRESENT_RE.test(end);
    if (!exp.title.trim() || !exp.company.trim()) add('error', 'experience', 'expBasics', { label }, id('basics'));
    if (!start || !end) add('error', 'experience', 'expDates', { label }, id('dates'));
    else if (!DATE_RE.test(start) || !(DATE_RE.test(end) || PRESENT_RE.test(end)))
      add('warning', 'experience', 'expDateFormat', { label }, id('datefmt'));
    else if (!MONTH_DATE_RE.test(start)) add('tip', 'experience', 'expMonth', { label }, id('month'));

    const bullets = exp.bullets.filter((b) => b.trim());
    bulletTotal += bullets.length;
    if (bullets.length < 2) add('warning', 'experience', 'expBullets', { label, count: bullets.length }, id('bullets'));
    if (bullets.length > 7) add('tip', 'experience', 'expTooMany', { label }, id('many'));
    const roleQuantified = bullets.filter((b) => /\d/.test(b)).length;
    quantified += roleQuantified;
    if (bullets.length > 0 && roleQuantified === 0) add('warning', 'experience', 'expMetrics', { label }, id('metrics'));

    bullets.forEach((b, i) => {
      const n = words(b).length;
      if (n > 40) add('tip', 'experience', 'expLength', { label, count: n }, id(`len-${i}`));
      if (!english) return;
      const first = words(b)[0]?.toLowerCase().replace(/[^\p{L}]/gu, '') ?? '';
      const opening = b.trim().split(/\s+/).slice(0, 2).join(' ');
      if (WEAK_OPENERS.test(b.trim())) add('warning', 'experience', 'expWeak', { label, start: opening }, id(`weak-${i}`));
      else if (first && !ACTION_VERBS.has(first) && !first.endsWith('ed') && !IRREGULAR_PAST.has(first))
        add('tip', 'experience', 'expVerb', { label, start: b.slice(0, 40) }, id(`verb-${i}`));
      else if (finished && ACTION_VERBS.has(first) && !first.endsWith('ed') && !IRREGULAR_PAST.has(first))
        add('tip', 'experience', 'expTense', { label, start: opening }, id(`tense-${i}`));
    });
  });
  if (cv.experience.length > 0 && cv.experience.every((e) => e.start && e.end)) pass('dates');
  if (bulletTotal > 0 && quantified / bulletTotal >= 0.3) pass('quantified');

  // Education & extras.
  if (cv.education.length === 0) add('warning', 'education', 'education');
  else pass('education');
  if (cv.languages.length === 0) add('tip', 'extras', 'languages');

  // Language quality across the CV.
  const text = allText(cv);
  const found = english ? CLICHES.filter((c) => text.toLowerCase().includes(c)) : [];
  if (found.length) add('tip', 'summary', 'cliches', { list: found.map((c) => `"${c}"`).join(', ') });
  if (EMOJI_RE.test(text)) add('warning', 'profile', 'emoji');

  const wordCount = words(text).length;
  if (wordCount < 250) add('tip', 'experience', 'lengthShort', { words: wordCount });
  else if (wordCount > 1100) add('tip', 'experience', 'lengthLong', { words: wordCount });
  else pass('length');

  const weights = { error: 12, warning: 5, tip: 1.5 };
  const penalty = findings.reduce((sum, f) => sum + weights[f.severity], 0);
  const score = Math.max(0, Math.min(100, Math.round(100 - penalty)));
  return { score, findings, passed, wordCount };
}

/** Lowercased word tokens in any script; accents survive, so "développement" stays one word. */
export function tokenize(text: string) {
  return text
    .normalize('NFC')
    .toLowerCase()
    .replace(/[\u2019']/g, ' ')
    .replace(/[^\p{L}\p{N}+#./\s-]/gu, ' ')
    .split(/\s+/)
    .map((t) => t.replace(/^[-./]+|[-./]+$/g, ''))
    .filter(Boolean);
}

/** Extracts the most frequent meaningful terms (single words and two-word phrases) from a job description. */
export function extractKeywords(jobDescription: string, locale = 'en', limit = 30) {
  const stop = stopwordsFor(locale);
  const tokens = tokenize(jobDescription);
  const counts = new Map<string, number>();
  const bump = (k: string, by = 1) => counts.set(k, (counts.get(k) ?? 0) + by);
  const useful = (t: string) => t.length > 2 && !stop.has(t) && !/^\d+$/.test(t);
  tokens.forEach((t, i) => {
    if (useful(t)) bump(t);
    const next = tokens[i + 1];
    if (next && useful(t) && useful(next)) bump(`${t} ${next}`, 1.5);
  });
  return [...counts.entries()]
    .filter(([k, n]) => n >= (k.includes(' ') ? 3 : 1))
    .sort((a, b) => b[1] - a[1])
    .slice(0, limit)
    .map(([k]) => k);
}

const singular = (t: string) => (t.length > 3 && t.endsWith('s') && !t.endsWith('ss') ? t.slice(0, -1) : t);

/** Whole-word matching: "java" does not match "javascript", plurals count as the same word. */
export function matchKeywords(cv: CVData, jobDescription: string, locale = 'en') {
  const tokens = tokenize(allText(cv)).map(singular);
  const words = new Set(tokens);
  const pairs = new Set(tokens.slice(1).map((t, i) => `${tokens[i]} ${t}`));
  const has = (k: string) => {
    const parts = k.split(' ').map(singular);
    return parts.length === 1 ? words.has(parts[0]) : pairs.has(parts.join(' '));
  };
  const keywords = extractKeywords(jobDescription, locale);
  const matched = keywords.filter(has);
  const missing = keywords.filter((k) => !has(k));
  const rate = keywords.length ? Math.round((matched.length / keywords.length) * 100) : 0;
  return { keywords, matched, missing, rate };
}
