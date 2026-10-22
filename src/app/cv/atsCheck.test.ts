import { describe, expect, it } from 'vitest';
import { extractKeywords, matchKeywords, tokenize } from './atsCheck';
import { blankCV } from './defaultCV';
import { findPerson } from './people';
import type { CVData } from './types';

const cvWith = (text: string): CVData => ({ ...structuredClone(blankCV), summary: text });

describe('keywords with accented letters', () => {
  const ad = 'Expérience en développement produit et accessibilité';
  it('keeps accented words whole', () => {
    expect(tokenize(ad)).toEqual(['expérience', 'en', 'développement', 'produit', 'et', 'accessibilité']);
  });
  it('extracts French keywords without fragments', () => {
    const keys = extractKeywords(ad, 'fr');
    expect(keys).toContain('développement');
    expect(keys).toContain('accessibilité');
    expect(keys.some((k) => ['exp', 'rience', 'veloppement', 'accessibilit'].includes(k))).toBe(false);
  });
});

describe('whole-word matching', () => {
  it('does not match java inside javascript', () => {
    expect(matchKeywords(cvWith('Built apps in JavaScript.'), 'Java', 'en').matched).toEqual([]);
  });
  it('does not match ux inside luxury', () => {
    expect(matchKeywords(cvWith('Luxury brands.'), 'ux', 'en').matched).toEqual([]);
  });
  it('matches phrases and plurals', () => {
    const ad = 'design systems design systems design systems';
    expect(matchKeywords(cvWith('I build Design Systems.'), ad, 'en').matched).toContain('design systems');
    expect(matchKeywords(cvWith('One design system.'), ad, 'en').matched).toContain('design systems');
  });
});

describe('stopwords', () => {
  it('leaves no filler in the homepage demo ad', () => {
    const ad =
      'UX Researcher. You will run user interviews, usability testing and survey design, and work closely with product teams. ' +
      'Accessibility experience is a must; journey mapping and research ops are key.';
    const { keywords } = matchKeywords(findPerson('sofia-andersson')!.cv, ad, 'en');
    for (const filler of ['own', 'run', 'closely', 'will', 'must', 'key', 'experience', 'work']) {
      expect(keywords).not.toContain(filler);
    }
  });
  it('drops French job-ad filler', () => {
    const keys = extractKeywords('Nous recherchons, au sein de notre équipe, afin de renforcer notamment le design', 'fr');
    expect(keys).toEqual(['renforcer', 'design']);
  });
});

import { extractJobTitle, runAtsCheck, titleMatch } from './atsCheck';

/** Every field filled, dates with months, but generic bullets without a single number. */
const generic: CVData = {
  ...structuredClone(blankCV),
  profile: { name: 'Alex Martin', headline: 'Marketing Manager', email: 'alex@example.com', phone: '+33 6 00 00 00 00', location: 'Lyon, France', website: '', linkedin: 'linkedin.com/in/alex' },
  summary:
    'Marketing manager with a background in brand and digital campaigns for consumer products. Works across teams to plan launches, manage agencies and keep brands consistent across every channel and market, from print to social.',
  skills: ['Brand strategy', 'Campaign planning', 'Content marketing', 'SEO', 'Budgeting', 'Team leadership'],
  experience: [
    { id: 'a', title: 'Marketing Manager', company: 'Brandco', location: 'Lyon', employmentType: '', start: 'Jan 2021', end: 'Present', bullets: ['Managed campaigns for the main product lines.', 'Coordinated agencies and freelancers.', 'Planned the yearly marketing calendar.'] },
    { id: 'b', title: 'Marketing Specialist', company: 'Shopco', location: 'Lyon', employmentType: '', start: 'Mar 2017', end: 'Dec 2020', bullets: ['Created content for social channels.', 'Supported product launches.', 'Reported on campaign results.'] },
  ],
  education: [{ id: 'e', degree: 'MSc Marketing', school: 'Université de Lyon', location: '', start: '2015', end: '2017', details: '' }],
  languages: [{ id: 'l', name: 'French', level: 'Native' }],
};

const missingPoints = (cv: CVData, targetTitle?: string) =>
  runAtsCheck(cv, 'en', { targetTitle }).findings.reduce((sum, f) => sum + f.weight, 0);

describe('scoring', () => {
  it('gives an empty CV 0', () => {
    expect(runAtsCheck(structuredClone(blankCV), 'en').score).toBe(0);
  });
  it('adds up: the score plus the points of every open finding is 100', () => {
    const named = { ...structuredClone(blankCV), profile: { ...blankCV.profile, name: 'Alex Martin' } };
    for (const [cv, title] of [[blankCV, undefined], [named, undefined], [generic, undefined], [generic, 'Data Engineer']] as const) {
      expect(runAtsCheck(cv, 'en', { targetTitle: title }).score + missingPoints(cv, title)).toBeCloseTo(100, 0);
    }
  });
  it('earns points step by step: a name alone is worth 6', () => {
    const named = { ...structuredClone(blankCV), profile: { ...blankCV.profile, name: 'Alex Martin' } };
    expect(runAtsCheck(named, 'en').score).toBe(6);
  });
  it('keeps a filled-in but generic CV below Strong', () => {
    expect(runAtsCheck(generic, 'en').score).toBeLessThan(85);
  });
  it('rewards numbers and a strong latest role', () => {
    const strong = structuredClone(generic);
    strong.experience[0].bullets = ['Grew qualified leads by 40% in 12 months with a new content plan.', 'Cut agency costs by €120k a year.', 'Launched 3 product lines in 5 markets.'];
    strong.experience[1].bullets = ['Built a social audience of 50k followers.', 'Supported 6 product launches.', 'Reported on campaign results.'];
    strong.summary += ' 8 years of experience.';
    expect(runAtsCheck(strong, 'en').score).toBeGreaterThanOrEqual(85);
  });
  it('makes LinkedIn and languages worth 1 point each', () => {
    const cv = structuredClone(generic);
    cv.profile.linkedin = '';
    cv.languages = [];
    const diff = runAtsCheck(generic, 'en').score - runAtsCheck(cv, 'en').score;
    expect(diff).toBeLessThanOrEqual(2);
  });
  it('weighs the job title when an ad is pasted', () => {
    expect(runAtsCheck(generic, 'en', { targetTitle: 'Data Engineer' }).findings.some((f) => f.key === 'titleNone')).toBe(true);
    expect(runAtsCheck(generic, 'en', { targetTitle: 'Senior Marketing Manager' }).findings.some((f) => f.key.startsWith('title'))).toBe(false);
  });
});

describe('job title', () => {
  it.each([
    ["We're hiring a Senior Product Designer to lead our design system.", 'Senior Product Designer'],
    ['Nous recherchons un(e) Chef de projet digital pour rejoindre notre équipe.', 'Chef de projet digital'],
    ['Cerchiamo un Infermiere professionale per il reparto di cardiologia.', 'Infermiere professionale'],
    ['Buscamos un Desarrollador Backend con experiencia en Go.', 'Desarrollador Backend'],
    ['Wir suchen dich als UX Writer (m/w/d) in Berlin.', 'UX Writer'],
    ['Procuramos um Analista de Dados para a nossa equipa.', 'Analista de Dados'],
    ['Wij zoeken een Accountmanager voor onze klanten.', 'Accountmanager'],
    ['Product Designer\nAbout us: we build tools.', 'Product Designer'],
  ])('finds the title in "%s"', (ad, title) => {
    expect(extractJobTitle(ad)).toBe(title);
  });
  it('tells headline, past title and no match apart', () => {
    expect(titleMatch(generic, 'Senior Marketing Manager')).toBe('headline');
    expect(titleMatch(generic, 'Marketing Specialist')).toBe('past');
    expect(titleMatch(generic, 'Data Engineer')).toBe('none');
  });
});
