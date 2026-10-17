import { describe, expect, it } from 'vitest';
import { extractKeywords, matchKeywords, tokenize } from './atsCheck';
import { blankCV, sampleCV } from './defaultCV';
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
      'Senior Product Designer. You will own our design systems and accessibility, run user research, prototyping in Figma, ' +
      'and work closely with engineering on data-driven product decisions. Design systems experience is a must; accessibility is key.';
    const { keywords } = matchKeywords(sampleCV, ad, 'en');
    for (const filler of ['own', 'run', 'closely', 'will', 'must', 'key', 'experience', 'work']) {
      expect(keywords).not.toContain(filler);
    }
  });
  it('drops French job-ad filler', () => {
    const keys = extractKeywords('Nous recherchons, au sein de notre équipe, afin de renforcer notamment le design', 'fr');
    expect(keys).toEqual(['renforcer', 'design']);
  });
});
