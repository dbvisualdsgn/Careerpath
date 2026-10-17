// Heuristic checks based on how recruiters read, search and rank CVs (and how parsers read them):
// parseable contact details, standard sections, dated roles, achievement-led bullets, keywords.
//
// SCORING. The score is 100 minus the points of every finding, clamped to 0–100. Points are explicit,
// so a CV that only fills fields in does not reach the top: evidence (numbers, dates, a strong latest
// role, the right title) weighs most.
//
//   Essentials       name 15 · email 12 · no experience 25 · headline 8 · empty summary 6 · education 4
//   Per role         missing title/company 8 · missing dates 8 · unreadable dates 4 · no month on a date 4
//                    fewer than 2 bullets 4 · no number in any bullet 2
//   Evidence         share of bullets with a number: up to 25 (full marks at 50% or more)
//                    latest role: fewer than 3 bullets 6 · first bullet without a number 6
//   Job ad (if any)  title matches neither headline nor a past title 12 · matches a past title only 4
//   Wording          weak opener 3 · emoji 4 · fewer than 6 skills 4 · no core skills 3 · phone 3 · location 3
//   Tips (≤1 each)   LinkedIn, summary length, languages, pronouns, years in summary, verbs, tense,
//                    long bullets, too many bullets, clichés, overall length
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
  /** Points this finding takes off the score. */
  weight: number;
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

const WEIGHTS: Partial<Record<FindingKey, number>> = {
  name: 15, email: 12, experience: 25, headline: 8, summary: 6, education: 4,
  expBasics: 8, expDates: 8, expDateFormat: 4, expMonth: 4, expBullets: 4, expMetrics: 2,
  recentBullets: 6, recentFirst: 6, titleNone: 12, titleHeadline: 4,
  expWeak: 3, emoji: 4, skills: 4, skillsCore: 3, phone: 3, location: 3,
  linkedin: 1, summaryShort: 1, summaryLong: 1, languages: 1, summaryPronoun: 1, summaryYears: 1,
  expVerb: 0.5, expTense: 0.5, expLength: 0.5, expTooMany: 1, cliches: 1, lengthShort: 1, lengthLong: 1,
};

/** Share of bullets with a number at which the evidence points are all earned. */
const METRICS_TARGET = 0.5;
const METRICS_WEIGHT = 25;

export interface AtsOptions {
  /** Job title from a pasted job ad, if any. */
  targetTitle?: string;
}

export function runAtsCheck(cv: CVData, locale: string = 'en', options: AtsOptions = {}): AtsReport {
  const findings: Finding[] = [];
  const passed: AtsReport['passed'] = [];
  const add = (severity: Severity, section: Finding['section'], key: FindingKey, params?: Params, id: string = key, weight = WEIGHTS[key] ?? 0) =>
    findings.push({ id, severity, section, key, params, weight });
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
    else if (!MONTH_DATE_RE.test(start) || (finished && !MONTH_DATE_RE.test(end)))
      add('warning', 'experience', 'expMonth', { label }, id('month'));

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

  // Evidence: how many bullets carry a number.
  if (bulletTotal > 0) {
    const share = quantified / bulletTotal;
    const percent = Math.round(share * 100);
    const missing = Math.max(0, 1 - share / METRICS_TARGET);
    if (missing > 0) add('warning', 'experience', 'metricsShare', { percent }, 'metrics-share', Math.round(METRICS_WEIGHT * missing * 10) / 10);
    else pass('quantified', { percent });
  }

  // The latest role is read first, so it should carry the most.
  const recent = cv.experience.find((e) => PRESENT_RE.test(e.end.trim())) ?? cv.experience[0];
  if (recent) {
    const label = recent.title || recent.company || '';
    const bullets = recent.bullets.filter((b) => b.trim());
    if (bullets.length < 3) add('warning', 'experience', 'recentBullets', { label, count: bullets.length }, 'recent-bullets');
    if (bullets.length > 0 && !/\d/.test(bullets[0])) add('warning', 'experience', 'recentFirst', { label }, 'recent-first');
    if (bullets.length >= 3 && /\d/.test(bullets[0])) pass('recent', { label });
  }

  // Job title from a pasted ad: recruiters search by title first.
  const target = options.targetTitle?.trim();
  if (target) {
    const fit = titleMatch(cv, target);
    if (fit === 'none') add('error', 'profile', 'titleNone', { title: target });
    else if (fit === 'past') add('warning', 'profile', 'titleHeadline', { title: target });
    else pass('title', { title: target });
  }

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

  const penalty = findings.reduce((sum, f) => sum + f.weight, 0);
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

const SENIORITY = new Set(
  `senior junior sr jr lead principal staff head chief mid intern trainee i ii iii iv h/f f/h m/f m/w/d m/f/d w/m/d
  confirmé confirmée expérimenté expérimentée stagiaire alternant alternante esperto esperta stagista
  experimentado experimentada becario becaria erfahrener erfahrene praktikant praktikantin ervaren stagiair`
    .split(/\s+/)
    .filter(Boolean),
);

function titleWords(text: string) {
  const stop = stopwordsFor('en');
  return tokenize(text).map(singular).filter((t) => !SENIORITY.has(t) && !stop.has(t) && t !== '&' && t !== '/');
}

/** Where a job title shows up in the CV: in the headline, in a past role, or nowhere. */
export function titleMatch(cv: CVData, title: string): 'headline' | 'past' | 'none' {
  const wanted = titleWords(title);
  if (!wanted.length) return 'headline';
  const covers = (text: string) => {
    const have = new Set(titleWords(text));
    return wanted.every((w) => have.has(w));
  };
  if (covers(cv.profile.headline)) return 'headline';
  if (cv.experience.some((e) => covers(e.title))) return 'past';
  return 'none';
}

const TITLE_LEADS = [
  /\b(?:we(?:['’]re| are)|i['’]m|i am)\s+(?:hiring|looking for|recruiting|seeking)\s+(?:an?\s+|our next\s+|our first\s+)?(.+)/i,
  /\b(?:join us as|hiring:?)\s+(?:an?\s+)?(.+)/i,
  /\b(?:nous\s+)?(?:recrutons|recherchons)\s+(?:un\(e\)|un·e|une?|des)?\s*(.+)/i,
  /\b(?:cerchiamo|stiamo cercando|ricerchiamo|selezioniamo)\s+(?:un\(a\)|un\/una|un['’]|una?|uno)?\s*(.+)/i,
  /\b(?:buscamos|estamos buscando|seleccionamos)\s+(?:un\/a|un\(a\)|una?)?\s*(.+)/i,
  /\bwir suchen\s+(?:dich als|sie als|eine?n?)?\s*(.+)/i,
  /\b(?:procuramos|estamos à procura de|buscamos)\s+(?:um\(a\)|uma?)?\s*(.+)/i,
  /\b(?:wij zoeken|we zoeken)\s+(?:een)?\s*(.+)/i,
  /^\s*(?:job title|title|position|role|poste|intitulé du poste|posizione|ruolo|puesto|stelle|position|vaga|função|functie|vacature)\s*[:：]\s*(.+)/im,
];
const TITLE_STOP =
  /\s(?:to|who|for|with|in|at|on|that|pour|qui|avec|au|dans|chez|per|che|con|presso|para|que|con|en|der|die|das|für|mit|um|zur|zum|om|die|voor|met|bij)\s.*$/i;

/** Best guess at the job title in an ad: the phrase after "we're hiring a…" (in 7 languages), or the first short line. */
export function extractJobTitle(jobDescription: string) {
  const text = jobDescription.normalize('NFC');
  const clean = (raw: string) =>
    raw
      .split(/[.,;:!?\n(|–—]/)[0]
      .replace(TITLE_STOP, '')
      .trim()
      .split(/\s+/)
      .slice(0, 6)
      .join(' ')
      .replace(/[\s-]+$/, '');
  for (const re of TITLE_LEADS) {
    const m = text.match(re);
    if (m?.[1] && clean(m[1])) return clean(m[1]);
  }
  const first = text.split('\n').map((l) => l.trim()).find(Boolean) ?? '';
  const line = clean(first);
  return line.split(/\s+/).length <= 8 ? line : '';
}
