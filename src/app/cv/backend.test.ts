import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { normalize, safeImage } from './useCV';
import { blankCV } from './defaultCV';

describe('normalize keeps public CVs safe', () => {
  it('drops remote and script images, keeps our own data URLs and logo tokens', () => {
    expect(safeImage('https://evil.example/pixel.png')).toBeUndefined();
    expect(safeImage('javascript:alert(1)')).toBeUndefined();
    expect(safeImage('data:text/html;base64,PHNjcmlwdD4=')).toBeUndefined();
    expect(safeImage('data:image/png;base64,iVBORw0KGgo=')).toBe('data:image/png;base64,iVBORw0KGgo=');
    expect(safeImage('@logo:brand:figma')).toBe('@logo:brand:figma');
  });
  it('coerces fields to strings and limits lengths', () => {
    const cv = normalize({
      profile: { name: { evil: true }, headline: 'x'.repeat(1000), photo: 'https://track.example/p.gif' },
      skills: ['ok', 42, { no: 1 }],
      tools: [{ name: 'Figma', icon: 'http://x/y.svg' }],
      experience: [{ title: 'T', bullets: ['a', 7], logo: 'data:image/svg+xml;utf8,<svg/>' }],
    });
    expect(cv.profile.name).toBe('');
    expect(cv.profile.headline.length).toBe(300);
    expect(cv.profile.photo).toBeUndefined();
    expect(cv.skills).toEqual(['ok']);
    expect(cv.tools[0].icon).toBeUndefined();
    expect(cv.experience[0].bullets).toEqual(['a', '7']);
    expect(cv.experience[0].logo).toBe('data:image/svg+xml;utf8,<svg/>');
  });
});

describe('backend client', () => {
  const calls: { url: string; init?: RequestInit }[] = [];
  beforeEach(() => {
    vi.resetModules();
    vi.stubEnv('VITE_SUPABASE_URL', 'https://demo.supabase.co/');
    vi.stubEnv('VITE_SUPABASE_ANON_KEY', 'anon');
    calls.length = 0;
    vi.stubGlobal('fetch', vi.fn(async (url: string, init?: RequestInit) => {
      calls.push({ url, init });
      return new Response(url.includes('public_cvs') ? JSON.stringify([]) : '', { status: 200 });
    }));
  });
  afterEach(() => {
    vi.unstubAllEnvs();
    vi.unstubAllGlobals();
  });

  it('makes ids and tokens of the right shape', async () => {
    const b = await import('./backend');
    expect(b.newPublicId()).toMatch(/^[a-z0-9]{10}$/);
    expect(b.newOwnerToken().length).toBeGreaterThanOrEqual(43);
    expect(b.newOwnerToken()).not.toBe(b.newOwnerToken());
  });
  it('publishes through the RPC with the token, never by writing the table', async () => {
    const b = await import('./backend');
    await b.publishCV({ id: 'abcdefghij', token: 't'.repeat(43), cv: structuredClone(blankCV), listed: true });
    expect(calls[0].url).toBe('https://demo.supabase.co/rest/v1/rpc/publish_cv');
    expect(calls[0].init?.method).toBe('POST');
    const body = JSON.parse(String(calls[0].init?.body));
    expect(body).toMatchObject({ p_id: 'abcdefghij', p_token: 't'.repeat(43), p_listed: true });
    expect((calls[0].init?.headers as Record<string, string>).apikey).toBe('anon');
  });
  it('reads public CVs without asking for the token hash', async () => {
    const b = await import('./backend');
    await b.fetchPublicCV('abcdefghij');
    await b.listPublicCVs();
    expect(calls.every((c) => !c.url.includes('token'))).toBe(true);
    expect(calls[1].url).toContain('listed=eq.true');
    expect(await b.fetchPublicCV('../../etc')).toBeNull();
  });
  it('is off when the site has no backend settings', async () => {
    vi.stubEnv('VITE_SUPABASE_URL', '');
    const b = await import('./backend');
    expect(b.isBackendReady()).toBe(false);
  });
});
