// Public CVs live in a small Supabase project (see supabase/schema.sql). Plain fetch to its REST API:
// anyone can read a public CV; publishing, updating and making private again need the owner token,
// which only this browser holds. Making a CV private deletes the public copy.
import { normalize } from './useCV';
import type { CVData } from './types';

const URL_ = (import.meta.env.VITE_SUPABASE_URL as string | undefined)?.replace(/\/$/, '');
const KEY = import.meta.env.VITE_SUPABASE_ANON_KEY as string | undefined;
const COLUMNS = 'id,cv,name,headline,listed,updated_at';

/** False when the site was built without the backend settings: sharing is then unavailable. */
export const isBackendReady = () => Boolean(URL_ && KEY);

export interface PublicCV {
  id: string;
  cv: CVData;
  name: string;
  headline: string;
  listed: boolean;
  updatedAt: string;
}

export class BackendError extends Error {}

const headers = () => ({ apikey: KEY!, Authorization: `Bearer ${KEY}`, 'Content-Type': 'application/json' });

async function call<T>(path: string, init: RequestInit = {}): Promise<T> {
  if (!isBackendReady()) throw new BackendError('not configured');
  let res: Response;
  try {
    res = await fetch(`${URL_}/rest/v1/${path}`, { ...init, headers: { ...headers(), ...(init.headers ?? {}) } });
  } catch {
    throw new BackendError('offline');
  }
  if (!res.ok) throw new BackendError(`http ${res.status}`);
  const text = await res.text();
  return (text ? JSON.parse(text) : null) as T;
}

const rpc = (fn: string, body: Record<string, unknown>) => call<null>(`rpc/${fn}`, { method: 'POST', body: JSON.stringify(body) });

const toPublic = (row: { id: string; cv: unknown; name: string; headline: string; listed: boolean; updated_at: string }): PublicCV => ({
  id: row.id,
  cv: normalize(row.cv),
  name: row.name,
  headline: row.headline,
  listed: row.listed,
  updatedAt: row.updated_at,
});

const random = (bytes: number) => crypto.getRandomValues(new Uint8Array(bytes));

/** A 10-character public id (lowercase letters and digits). */
export function newPublicId() {
  const abc = 'abcdefghijklmnopqrstuvwxyz0123456789';
  return Array.from(random(10), (b) => abc[b % abc.length]).join('');
}

/** A 32-byte secret, base64url: whoever holds it can update or withdraw the public copy. */
export function newOwnerToken() {
  return btoa(String.fromCharCode(...random(32))).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

export function publishCV(p: { id: string; token: string; cv: CVData; listed: boolean }) {
  return rpc('publish_cv', {
    p_id: p.id,
    p_token: p.token,
    p_cv: p.cv,
    p_name: p.cv.profile.name,
    p_headline: p.cv.profile.headline,
    p_listed: p.listed,
  });
}

export function unpublishCV(p: { id: string; token: string }) {
  return rpc('unpublish_cv', { p_id: p.id, p_token: p.token });
}

/** A public CV, or null when it doesn't exist (never published, or made private again). */
export async function fetchPublicCV(id: string): Promise<PublicCV | null> {
  if (!/^[a-z0-9]{10}$/.test(id)) return null;
  const rows = await call<Parameters<typeof toPublic>[0][]>(`public_cvs?id=eq.${id}&select=${COLUMNS}`);
  return rows[0] ? toPublic(rows[0]) : null;
}

/** CVs whose owners chose to show them on the Public CVs page, newest first. */
export async function listPublicCVs(limit = 200): Promise<PublicCV[]> {
  const rows = await call<Parameters<typeof toPublic>[0][]>(`public_cvs?listed=eq.true&select=${COLUMNS}&order=updated_at.desc&limit=${limit}`);
  return rows.map(toPublic);
}

export function reportCV(id: string, reason: string) {
  return rpc('report_cv', { p_id: id, p_reason: reason });
}

/** Where a public CV opens: the app page with its id. `embed` gives the compact view for iframes. */
export function publicCVUrl(id: string, embed = false) {
  const configured = import.meta.env.VITE_PUBLIC_URL as string | undefined;
  const base = configured || `${window.location.origin}${window.location.pathname.replace(/(people\/|app\/)?(index\.html)?$/, '')}app/`;
  return `${base}?id=${id}${embed ? '&embed=1' : ''}`;
}
