// Heuristic checks based on common ATS (applicant tracking system) and AI-screening guidance:
// parseable contact details, standard sections, dated roles, achievement-led bullets, keywords.
import type { CVData } from './types';

export type Severity = 'error' | 'warning' | 'tip';

export interface Finding {
  id: string;
  severity: Severity;
  message: string;
  section: 'profile' | 'summary' | 'skills' | 'experience' | 'education' | 'extras';
}

export interface AtsReport {
  score: number;
  findings: Finding[];
  passed: string[];
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
const DATE_RE = /^((jan|feb|mar|apr|may|jun|jul|aug|sep|sept|oct|nov|dec)[a-z]*\.?\s+)?(19|20)\d{2}$|^(0?[1-9]|1[0-2])\/(19|20)\d{2}$/i;
const MONTH_DATE_RE = /^((jan|feb|mar|apr|may|jun|jul|aug|sep|sept|oct|nov|dec)[a-z]*\.?\s+(19|20)\d{2}|(0?[1-9]|1[0-2])\/(19|20)\d{2})$/i;
const PRESENT_RE = /^(present|current|now|today)$/i;
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

export function runAtsCheck(cv: CVData): AtsReport {
  const findings: Finding[] = [];
  const passed: string[] = [];
  const add = (f: Finding) => findings.push(f);
  const pass = (msg: string) => passed.push(msg);
  const { profile } = cv;

  // Contact details: ATS parsers look for these in the document body.
  if (!profile.name.trim() || profile.name === 'Your Name') add({ id: 'name', severity: 'error', section: 'profile', message: 'Add your full name.' });
  if (!profile.headline.trim() || profile.headline === 'Your Job Title')
    add({ id: 'headline', severity: 'error', section: 'profile', message: 'Add a headline that matches the job title you are targeting.' });
  else pass('Headline / target job title present');
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(profile.email.trim()))
    add({ id: 'email', severity: 'error', section: 'profile', message: 'Add a valid email address.' });
  else pass('Valid email address');
  if (!profile.phone.trim()) add({ id: 'phone', severity: 'warning', section: 'profile', message: 'Add a phone number. Many ATS forms and recruiters expect one.' });
  else pass('Phone number present');
  if (!profile.location.trim())
    add({ id: 'location', severity: 'warning', section: 'profile', message: 'Add your city and country. ATS filters often screen by location.' });
  else pass('Location present');
  if (!profile.linkedin.trim()) add({ id: 'linkedin', severity: 'tip', section: 'profile', message: 'Add your LinkedIn URL. Recruiters and AI screeners cross-check it.' });

  // Summary.
  const summaryWords = words(cv.summary).length;
  if (summaryWords === 0) add({ id: 'summary', severity: 'error', section: 'summary', message: 'Add a professional summary (40–100 words).' });
  else if (summaryWords < 30) add({ id: 'summary-short', severity: 'warning', section: 'summary', message: `Summary is short (${summaryWords} words). Aim for 40–100 words with your title, years of experience and specialties.` });
  else if (summaryWords > 120) add({ id: 'summary-long', severity: 'warning', section: 'summary', message: `Summary is long (${summaryWords} words). Keep it under about 100 words.` });
  else pass('Summary length is good');
  if (FIRST_PERSON.test(cv.summary)) add({ id: 'summary-pronoun', severity: 'tip', section: 'summary', message: 'Drop first-person pronouns ("I", "my") from the summary.' });
  if (!/\d/.test(cv.summary) && summaryWords > 0)
    add({ id: 'summary-years', severity: 'tip', section: 'summary', message: 'Mention years of experience or a key number in the summary (e.g. "10+ years").' });

  // Skills.
  const skillCount = cv.skills.length + cv.tools.length;
  if (skillCount < 6) add({ id: 'skills', severity: 'warning', section: 'skills', message: `List at least 6–10 skills and tools (now ${skillCount}). Keywords are how ATS ranks you.` });
  else pass(`${skillCount} skills and tools listed as plain text`);
  if (cv.skills.length === 0) add({ id: 'skills-core', severity: 'warning', section: 'skills', message: 'Add core skills (e.g. "Design Systems"), not just tool names.' });

  // Experience.
  if (cv.experience.length === 0) add({ id: 'exp', severity: 'error', section: 'experience', message: 'Add at least one work experience.' });
  let quantified = 0;
  let bulletTotal = 0;
  cv.experience.forEach((exp) => {
    const label = exp.title || exp.company || 'Untitled role';
    if (!exp.title.trim() || !exp.company.trim())
      add({ id: `exp-${exp.id}-basics`, severity: 'error', section: 'experience', message: `${label}: add both a job title and a company.` });
    if (!exp.start.trim() || !exp.end.trim())
      add({ id: `exp-${exp.id}-dates`, severity: 'error', section: 'experience', message: `${label}: add start and end dates. Undated roles are often scored as missing.` });
    else {
      const startOk = DATE_RE.test(exp.start.trim());
      const endOk = DATE_RE.test(exp.end.trim()) || PRESENT_RE.test(exp.end.trim());
      if (!startOk || !endOk)
        add({ id: `exp-${exp.id}-datefmt`, severity: 'warning', section: 'experience', message: `${label}: use a standard date format like "Mar 2023" or "03/2023".` });
      else if (!MONTH_DATE_RE.test(exp.start.trim()))
        add({ id: `exp-${exp.id}-month`, severity: 'tip', section: 'experience', message: `${label}: add months ("Mar 2023 – Present") so ATS can calculate your experience.` });
    }
    const bullets = exp.bullets.filter((b) => b.trim());
    bulletTotal += bullets.length;
    if (bullets.length < 2)
      add({ id: `exp-${exp.id}-bullets`, severity: 'warning', section: 'experience', message: `${label}: add 3–5 achievement bullets (now ${bullets.length}).` });
    if (bullets.length > 7)
      add({ id: `exp-${exp.id}-many`, severity: 'tip', section: 'experience', message: `${label}: trim to your 5–6 strongest bullets.` });
    const roleQuantified = bullets.filter((b) => /\d/.test(b)).length;
    quantified += roleQuantified;
    if (bullets.length > 0 && roleQuantified === 0)
      add({ id: `exp-${exp.id}-metrics`, severity: 'warning', section: 'experience', message: `${label}: quantify at least one result (%, €, users, time saved).` });
    bullets.forEach((b, i) => {
      const first = words(b)[0]?.toLowerCase().replace(/[^a-z]/g, '') ?? '';
      if (WEAK_OPENERS.test(b.trim()))
        add({ id: `exp-${exp.id}-weak-${i}`, severity: 'warning', section: 'experience', message: `${label}: replace "${b.split(' ').slice(0, 2).join(' ')}…" with a strong action verb (Led, Built, Increased…).` });
      else if (first && !ACTION_VERBS.has(first) && !first.endsWith('ed'))
        add({ id: `exp-${exp.id}-verb-${i}`, severity: 'tip', section: 'experience', message: `${label}: start "${b.slice(0, 40)}…" with an action verb.` });
      if (exp.end.trim() && !PRESENT_RE.test(exp.end.trim()) && ACTION_VERBS.has(first) && !first.endsWith('ed') && !IRREGULAR_PAST.has(first))
        add({ id: `exp-${exp.id}-tense-${i}`, severity: 'tip', section: 'experience', message: `${label}: use past tense for a finished role ("${b.split(' ')[0]}…").` });
      const n = words(b).length;
      if (n > 40) add({ id: `exp-${exp.id}-len-${i}`, severity: 'tip', section: 'experience', message: `${label}: shorten a ${n}-word bullet to under 30 words.` });
    });
  });
  if (cv.experience.length > 0 && cv.experience.every((e) => e.start && e.end)) pass('Every role has dates');
  if (bulletTotal > 0 && quantified / bulletTotal >= 0.3) pass('Achievements are quantified');

  // Education & extras.
  if (cv.education.length === 0)
    add({ id: 'education', severity: 'warning', section: 'education', message: 'Add an Education section. Many ATS filters require one, even for senior roles.' });
  else pass('Education section present');
  if (cv.languages.length === 0)
    add({ id: 'languages', severity: 'tip', section: 'extras', message: 'Add the languages you speak, with a level (e.g. "English – C1").' });

  // Language quality across the CV.
  const text = allText(cv);
  const found = CLICHES.filter((c) => text.toLowerCase().includes(c));
  if (found.length) add({ id: 'cliches', severity: 'tip', section: 'summary', message: `Replace clichés with evidence: ${found.map((c) => `"${c}"`).join(', ')}.` });
  if (EMOJI_RE.test(text)) add({ id: 'emoji', severity: 'warning', section: 'profile', message: 'Remove emoji from your text. Parsers often turn them into garbage characters.' });

  const wordCount = words(text).length;
  if (wordCount < 250) add({ id: 'length-short', severity: 'tip', section: 'experience', message: `The CV is light (${wordCount} words). 400–800 words gives ATS more keywords to match.` });
  else if (wordCount > 1100) add({ id: 'length-long', severity: 'tip', section: 'experience', message: `The CV is long (${wordCount} words). Aim for 1–2 pages.` });
  else pass('Overall length is in range');

  const weights = { error: 12, warning: 5, tip: 1.5 };
  const penalty = findings.reduce((sum, f) => sum + weights[f.severity], 0);
  const score = Math.max(0, Math.min(100, Math.round(100 - penalty)));
  return { score, findings, passed, wordCount };
}

const STOPWORDS = new Set(
  `a about above across after again against all also am an and any are as at be because been before being below between
  both but by can could did do does doing down during each few for from further had has have having he her here hers him
  his how i if in into is it its itself just like make may more most must my no nor not now of off on once only or other
  our ours out over own per same she should so some such than that the their them then there these they this those
  through to too under until up us very via was we well were what when where which while who whom why will with within
  without would you your yours etc including include includes strong ability experience experiences work working team
  teams role roles years year looking join help using use new across based within plus great good best ideal candidate
  responsibilities requirements required preferred qualifications skills skill knowledge understanding environment
  company job position opportunity apply applicants candidates we're you'll you're it's day days`
    .split(/\s+/)
    .filter(Boolean),
);

/** Extracts the most frequent meaningful terms (single words and two-word phrases) from a job description. */
export function extractKeywords(jobDescription: string, limit = 30) {
  const tokens = jobDescription
    .toLowerCase()
    .replace(/[^a-z0-9+#./\s-]/g, ' ')
    .split(/\s+/)
    .map((t) => t.replace(/^[-./]+|[-./]+$/g, ''))
    .filter(Boolean);
  const counts = new Map<string, number>();
  const bump = (k: string, by = 1) => counts.set(k, (counts.get(k) ?? 0) + by);
  tokens.forEach((t, i) => {
    if (t.length > 2 && !STOPWORDS.has(t) && !/^\d+$/.test(t)) bump(t);
    const next = tokens[i + 1];
    if (next && !STOPWORDS.has(t) && !STOPWORDS.has(next) && t.length > 2 && next.length > 2) bump(`${t} ${next}`, 1.5);
  });
  return [...counts.entries()]
    .filter(([k, n]) => n >= (k.includes(' ') ? 3 : 1))
    .sort((a, b) => b[1] - a[1])
    .slice(0, limit)
    .map(([k]) => k);
}

export function matchKeywords(cv: CVData, jobDescription: string) {
  const haystack = allText(cv).toLowerCase();
  const keywords = extractKeywords(jobDescription);
  const matched = keywords.filter((k) => haystack.includes(k));
  const missing = keywords.filter((k) => !haystack.includes(k));
  const rate = keywords.length ? Math.round((matched.length / keywords.length) * 100) : 0;
  return { keywords, matched, missing, rate };
}
