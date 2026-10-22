// Heuristic checks based on how recruiters read, search and rank CVs (and how parsers read them):
// parseable contact details, standard sections, dated roles, achievement-led bullets, keywords.
//
// SCORING. Every criterion earns points, and together they add up to exactly 100, so an empty CV scores 0.
// Each finding carries the points it would add: the score plus the points of the open findings is always 100.
//
//   Contact & title  22   name 6 · email 6 · headline 6 (with a job ad: its title in the headline 6, in a past role 3)
//                          · phone 2 · location 2
//   Summary           8   written 4 · 30–120 words 4
//   Skills           10   6 or more skills and tools 7 (pro rata) · core skills, not only tools 3
//   Experience       40   at least one role 5
//                          per role, averaged: title and company 5 · readable dates with months 5 · 3+ bullets 5 (pro rata)
//                          evidence: half the bullets with a number 15 (pro rata)
//                          latest role: 3+ bullets 3 · first bullet with a number 2
//   Education        10
//   Extras            2   languages 1 · LinkedIn 1
//   Length            8   up to 250 words (pro rata); over 1,100 words 4
//   Tips              0   emoji, weak openers, clichés, pronouns, years in summary, verbs, tense, long or many bullets
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

const POINTS = {
  name: 6, email: 6, headline: 6, phone: 2, location: 2,
  summary: 4, summaryLength: 4,
  skills: 7, skillsCore: 3,
  role: 5, roleBasics: 5, roleDates: 5, roleBullets: 5, evidence: 15, recentBullets: 3, recentFirst: 2,
  education: 10, languages: 1, linkedin: 1,
  length: 8,
};

/** Share of bullets with a number at which the evidence points are all earned. */
const METRICS_TARGET = 0.5;
const round1 = (n: number) => Math.round(n * 10) / 10;

export interface AtsOptions {
  /** Job title from a pasted job ad, if any. */
  targetTitle?: string;
}

export function runAtsCheck(cv: CVData, locale: string = 'en', options: AtsOptions = {}): AtsReport {
  const findings: Finding[] = [];
  const passed: AtsReport['passed'] = [];
  // `weight` is the number of points the fix would add (0 for tips that are good advice but not scored).
  const add = (severity: Severity, section: Finding['section'], key: FindingKey, weight: number, params?: Params, id: string = key) =>
    findings.push({ id, severity, section, key, params, weight: round1(weight) });
  const pass = (key: PassedKey, params?: Params) => passed.push({ key, params });
  // Verb, tense, pronoun and cliché checks rely on English word lists.
  const english = locale === 'en';
  const { profile } = cv;
  const target = options.targetTitle?.trim();

  // Contact details and title: parsers and recruiters look for these first.
  if (!profile.name.trim()) add('error', 'profile', 'name', POINTS.name);
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(profile.email.trim())) add('error', 'profile', 'email', POINTS.email);
  else pass('email');
  if (!profile.headline.trim()) add('error', 'profile', 'headline', POINTS.headline);
  else if (target) {
    // With a job ad, the headline earns its points when it carries the ad's title.
    const fit = titleMatch(cv, target);
    if (fit === 'none') add('error', 'profile', 'titleNone', POINTS.headline, { title: target });
    else if (fit === 'past') add('warning', 'profile', 'titleHeadline', POINTS.headline / 2, { title: target });
    else pass('title', { title: target });
  } else pass('headline');
  if (!profile.phone.trim()) add('warning', 'profile', 'phone', POINTS.phone);
  else pass('phone');
  if (!profile.location.trim()) add('warning', 'profile', 'location', POINTS.location);
  else pass('location');
  if (!profile.linkedin.trim()) add('tip', 'profile', 'linkedin', POINTS.linkedin);

  // Summary.
  const summaryWords = words(cv.summary).length;
  if (summaryWords === 0) add('error', 'summary', 'summary', POINTS.summary + POINTS.summaryLength);
  else if (summaryWords < 30) add('warning', 'summary', 'summaryShort', POINTS.summaryLength, { words: summaryWords });
  else if (summaryWords > 120) add('warning', 'summary', 'summaryLong', POINTS.summaryLength, { words: summaryWords });
  else pass('summary');
  if (english && FIRST_PERSON.test(cv.summary)) add('tip', 'summary', 'summaryPronoun', 0);
  if (summaryWords > 0 && !/\d/.test(cv.summary)) add('tip', 'summary', 'summaryYears', 0);

  // Skills.
  const skillCount = cv.skills.length + cv.tools.length;
  if (skillCount < 6) add('warning', 'skills', 'skills', POINTS.skills * (1 - skillCount / 6), { count: skillCount });
  else pass('skills', { count: skillCount });
  if (cv.skills.length === 0) add('warning', 'skills', 'skillsCore', POINTS.skillsCore);

  // Experience.
  const roles = cv.experience;
  if (roles.length === 0) {
    // Nothing to judge yet: every experience point waits on the first role.
    add('error', 'experience', 'experience', POINTS.role + POINTS.roleBasics + POINTS.roleDates + POINTS.roleBullets + POINTS.evidence + POINTS.recentBullets + POINTS.recentFirst);
  }
  // Per-role points are averaged, so each role's fix is worth its share.
  const share = roles.length ? 1 / roles.length : 0;
  let quantified = 0;
  let bulletTotal = 0;
  roles.forEach((exp) => {
    const label = exp.title || exp.company || '';
    const id = (suffix: string) => `exp-${exp.id}-${suffix}`;
    const start = exp.start.trim();
    const end = exp.end.trim();
    const finished = Boolean(end) && !PRESENT_RE.test(end);
    if (!exp.title.trim() || !exp.company.trim()) add('error', 'experience', 'expBasics', POINTS.roleBasics * share, { label }, id('basics'));
    if (!start || !end) add('error', 'experience', 'expDates', POINTS.roleDates * share, { label }, id('dates'));
    else if (!DATE_RE.test(start) || !(DATE_RE.test(end) || PRESENT_RE.test(end)))
      add('warning', 'experience', 'expDateFormat', POINTS.roleDates * 0.8 * share, { label }, id('datefmt'));
    else if (!MONTH_DATE_RE.test(start) || (finished && !MONTH_DATE_RE.test(end)))
      add('warning', 'experience', 'expMonth', POINTS.roleDates * 0.4 * share, { label }, id('month'));

    const bullets = exp.bullets.filter((b) => b.trim());
    bulletTotal += bullets.length;
    if (bullets.length < 3) add('warning', 'experience', 'expBullets', POINTS.roleBullets * (1 - bullets.length / 3) * share, { label, count: bullets.length }, id('bullets'));
    if (bullets.length > 7) add('tip', 'experience', 'expTooMany', 0, { label }, id('many'));
    const roleQuantified = bullets.filter((b) => /\d/.test(b)).length;
    quantified += roleQuantified;
    if (bullets.length > 0 && roleQuantified === 0) add('tip', 'experience', 'expMetrics', 0, { label }, id('metrics'));

    bullets.forEach((b, i) => {
      const n = words(b).length;
      if (n > 40) add('tip', 'experience', 'expLength', 0, { label, count: n }, id(`len-${i}`));
      if (!english) return;
      const first = words(b)[0]?.toLowerCase().replace(/[^\p{L}]/gu, '') ?? '';
      const opening = b.trim().split(/\s+/).slice(0, 2).join(' ');
      if (WEAK_OPENERS.test(b.trim())) add('warning', 'experience', 'expWeak', 0, { label, start: opening }, id(`weak-${i}`));
      else if (first && !ACTION_VERBS.has(first) && !first.endsWith('ed') && !IRREGULAR_PAST.has(first))
        add('tip', 'experience', 'expVerb', 0, { label, start: b.slice(0, 40) }, id(`verb-${i}`));
      else if (finished && ACTION_VERBS.has(first) && !first.endsWith('ed') && !IRREGULAR_PAST.has(first))
        add('tip', 'experience', 'expTense', 0, { label, start: opening }, id(`tense-${i}`));
    });
  });
  if (roles.length > 0 && roles.every((e) => e.start && e.end)) pass('dates');

  // Evidence: how many bullets carry a number. No bullets yet counts as none.
  if (roles.length > 0) {
    const ratio = bulletTotal ? quantified / bulletTotal : 0;
    const percent = Math.round(ratio * 100);
    const missing = Math.max(0, 1 - ratio / METRICS_TARGET);
    if (missing > 0) add('warning', 'experience', 'metricsShare', POINTS.evidence * missing, { percent }, 'metrics-share');
    else pass('quantified', { percent });
  }

  // The latest role is read first, so it should carry the most.
  const recent = roles.find((e) => PRESENT_RE.test(e.end.trim())) ?? roles[0];
  if (recent) {
    const label = recent.title || recent.company || '';
    const bullets = recent.bullets.filter((b) => b.trim());
    if (bullets.length < 3) add('warning', 'experience', 'recentBullets', POINTS.recentBullets * (1 - bullets.length / 3), { label, count: bullets.length }, 'recent-bullets');
    if (!bullets.length || !/\d/.test(bullets[0])) add('warning', 'experience', 'recentFirst', POINTS.recentFirst, { label }, 'recent-first');
    if (bullets.length >= 3 && /\d/.test(bullets[0])) pass('recent', { label });
  }

  // Education & extras.
  if (cv.education.length === 0) add('warning', 'education', 'education', POINTS.education);
  else pass('education');
  if (cv.languages.length === 0) add('tip', 'extras', 'languages', POINTS.languages);

  // Language quality across the CV: advice, not points.
  const text = allText(cv);
  const found = english ? CLICHES.filter((c) => text.toLowerCase().includes(c)) : [];
  if (found.length) add('tip', 'summary', 'cliches', 0, { list: found.map((c) => `"${c}"`).join(', ') });
  if (EMOJI_RE.test(text)) add('warning', 'profile', 'emoji', 0);

  const wordCount = words(text).length;
  if (wordCount < 250) add('tip', 'experience', 'lengthShort', POINTS.length * (1 - wordCount / 250), { words: wordCount });
  else if (wordCount > 1100) add('tip', 'experience', 'lengthLong', POINTS.length / 2, { words: wordCount });
  else pass('length');

  const missing = findings.reduce((sum, f) => sum + f.weight, 0);
  const score = Math.max(0, Math.min(100, Math.round(100 - missing)));
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
