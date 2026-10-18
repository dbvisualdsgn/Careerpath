// The compact CV payload (deflate + base64url, built-in logos as tokens). It is embedded in our PDFs, and
// older share links carried it in the URL fragment (#cv=…): those links are still read, but no longer made.
// New links point to the public CV server instead (see backend.ts).
import { tokenizeLogos } from './logos';
import { normalize } from './useCV';
import type { CVData } from './types';

const PARAM = 'cv';
/** XMP namespace for the CV data embedded in our PDFs (jsPDF writes it as `jspdf:metadata`). */
export const PDF_DATA_NS = 'urn:curriculi-curricula:cv:1.0';
/** Namespace written by earlier versions; still read so older PDFs import exactly. */
export const LEGACY_PDF_DATA_NS = 'https://dbvisualdsgn.github.io/Careerpath/ns/cv/1.0/';

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

/** Compact, lossless CV payload (built-in logos as tokens, deflate + base64url). Used inside our PDFs. */
export async function packCV(cv: CVData) {
  return encode(await tokenizeLogos(cv));
}

export async function unpackCV(payload: string): Promise<CVData> {
  const json = new TextDecoder().decode(await pipe(fromBase64Url(payload), new DecompressionStream('deflate-raw')));
  // Logo tokens stay as they are; they are drawn on demand (see logos.ts).
  return normalize(JSON.parse(json));
}

/** Reads a shared CV from a location hash, or returns null when there is none. Throws on a broken link. */
export async function readSharedCV(hash: string): Promise<CVData | null> {
  const params = new URLSearchParams(hash.replace(/^#/, ''));
  const payload = params.get(PARAM);
  if (!payload) return null;
  return unpackCV(payload);
}

export function clearShareHash() {
  history.replaceState(null, '', `${window.location.pathname}${window.location.search}`);
}
