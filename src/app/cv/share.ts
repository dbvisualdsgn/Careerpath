// Share links carry the whole CV in the URL fragment (#cv=…), deflate-compressed and base64url-encoded.
// The fragment is never sent to a server, so any static host works and nothing is stored anywhere.
import { brandIcons } from './brandIcons';
import { companyLogos } from './companyLogos';
import { normalize } from './useCV';
import type { CVData } from './types';

const PARAM = 'cv';
/** XMP namespace for the CV data embedded in our PDFs (jsPDF writes it as `jspdf:metadata`). */
export const PDF_DATA_NS = 'urn:curriculi-curricula:cv:1.0';
/** Namespace written by earlier versions; still read so older PDFs import exactly. */
export const LEGACY_PDF_DATA_NS = 'https://dbvisualdsgn.github.io/Careerpath/ns/cv/1.0/';
const TOKEN = '@logo:';
/** Above this length, custom uploaded logos are left out so the link stays usable in chat apps. */
const MAX_LINK_CHARS = 24000;

// Built-in logos travel as short tokens instead of full SVG/PNG data.
const knownLogos: Record<string, string> = {
  ...Object.fromEntries(Object.entries(brandIcons).map(([k, v]) => [`brand:${k}`, v])),
  ...Object.fromEntries(Object.entries(companyLogos).map(([k, v]) => [`company:${k}`, v])),
};
const tokenFor = new Map(Object.entries(knownLogos).map(([k, v]) => [v, `${TOKEN}${k}`]));

function mapLogos(cv: CVData, fn: (logo: string | undefined) => string | undefined): CVData {
  return {
    ...cv,
    tools: cv.tools.map((t) => ({ ...t, icon: fn(t.icon) })),
    experience: cv.experience.map((e) => ({ ...e, logo: fn(e.logo) })),
  };
}

function toBase64Url(bytes: Uint8Array) {
  let bin = '';
  for (let i = 0; i < bytes.length; i += 0x8000) bin += String.fromCharCode(...bytes.subarray(i, i + 0x8000));
  return btoa(bin).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}
function fromBase64Url(s: string) {
  const bin = atob(s.replace(/-/g, '+').replace(/_/g, '/'));
  return Uint8Array.from(bin, (c) => c.charCodeAt(0));
}
async function pipe(bytes: Uint8Array, stream: CompressionStream | DecompressionStream) {
  const out = new Blob([bytes]).stream().pipeThrough(stream);
  return new Uint8Array(await new Response(out).arrayBuffer());
}

async function encode(cv: CVData) {
  const json = JSON.stringify(cv);
  return toBase64Url(await pipe(new TextEncoder().encode(json), new CompressionStream('deflate-raw')));
}

export interface ShareLink {
  url: string;
  /** True when custom uploaded logos were left out to keep the link short. */
  droppedLogos: boolean;
}

export async function createShareLink(cv: CVData, baseUrl: string): Promise<ShareLink> {
  const tokenized = mapLogos(cv, (logo) => (logo ? tokenFor.get(logo) ?? logo : logo));
  let payload = await encode(tokenized);
  let droppedLogos = false;
  if (payload.length > MAX_LINK_CHARS) {
    // Drop uploaded logos first, then the photo, so the link stays usable in chat apps.
    const noCustomLogos = mapLogos(tokenized, (logo) => (logo?.startsWith(TOKEN) ? logo : undefined));
    payload = await encode(noCustomLogos);
    droppedLogos = true;
    if (payload.length > MAX_LINK_CHARS) {
      payload = await encode({ ...noCustomLogos, profile: { ...noCustomLogos.profile, photo: undefined } });
    }
  }
  return { url: `${baseUrl}#${PARAM}=${payload}`, droppedLogos };
}

/** Compact, lossless CV payload (built-in logos as tokens, deflate + base64url). Used inside our PDFs. */
export async function packCV(cv: CVData) {
  return encode(mapLogos(cv, (logo) => (logo ? tokenFor.get(logo) ?? logo : logo)));
}

export async function unpackCV(payload: string): Promise<CVData> {
  const json = new TextDecoder().decode(await pipe(fromBase64Url(payload), new DecompressionStream('deflate-raw')));
  const cv = normalize(JSON.parse(json));
  return mapLogos(cv, (logo) => (logo?.startsWith(TOKEN) ? knownLogos[logo.slice(TOKEN.length)] : logo));
}

/** Reads a shared CV from a location hash, or returns null when there is none. Throws on a broken link. */
export async function readSharedCV(hash: string): Promise<CVData | null> {
  const params = new URLSearchParams(hash.replace(/^#/, ''));
  const payload = params.get(PARAM);
  if (!payload) return null;
  return unpackCV(payload);
}

/** Where share links point: a configured public URL (VITE_PUBLIC_URL) or the current page. */
export function shareBaseUrl() {
  const configured = import.meta.env.VITE_PUBLIC_URL as string | undefined;
  return configured || `${window.location.origin}${window.location.pathname}`;
}

export function clearShareHash() {
  history.replaceState(null, '', `${window.location.pathname}${window.location.search}`);
}
