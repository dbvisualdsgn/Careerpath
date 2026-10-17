// Builds src/app/cv/icon-catalog/: a de-duplicated catalog of official brand logos for the editor's
// logo picker, split into a small title index plus one chunk per first character so a search only
// downloads the logos it shows. Sources (both CC0): Iconify "logos" (full colour) and Simple Icons (brand colour).
// Run: node scripts/generate-icon-catalog.mjs
import { mkdirSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { createRequire } from 'node:module';

const require = createRequire(import.meta.url);
const logos = JSON.parse(readFileSync(new URL('../node_modules/@iconify-json/logos/icons.json', import.meta.url)));
const simpleIcons = require('simple-icons');

const norm = (s) => s.toLowerCase().replace(/[^a-z0-9]/g, '');
const title = (name) => name.replace(/-icon$/, '').split('-').map((p) => p[0].toUpperCase() + p.slice(1)).join(' ');

const out = new Map();
// Prefer the compact "-icon" mark when a logo has one; wordmarks are unreadable at badge size.
const names = Object.keys(logos.icons).sort((a, b) => Number(b.endsWith('-icon')) - Number(a.endsWith('-icon')));
for (const name of names) {
  const t = title(name);
  if (out.has(norm(t))) continue;
  const icon = logos.icons[name];
  const w = icon.width ?? logos.width;
  const h = icon.height ?? logos.height;
  out.set(norm(t), [t, `<svg xmlns="http://www.w3.org/2000/svg" viewBox="${icon.left ?? 0} ${icon.top ?? 0} ${w} ${h}">${icon.body}</svg>`]);
}
for (const icon of Object.values(simpleIcons)) {
  if (!icon?.path || out.has(norm(icon.title))) continue;
  out.set(norm(icon.title), [icon.title, `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="#${icon.hex}"><path d="${icon.path}"/></svg>`]);
}

const list = [...out.values()].sort((a, b) => a[0].localeCompare(b[0]));
const dir = new URL('../src/app/cv/icon-catalog/', import.meta.url);
rmSync(dir, { recursive: true, force: true });
mkdirSync(dir, { recursive: true });

const chunkOf = (t) => {
  const c = norm(t)[0] ?? '_';
  return /[a-z]/.test(c) ? c : '0';
};
const chunks = {};
const index = list.map(([t, svg]) => {
  const chunk = chunkOf(t);
  (chunks[chunk] ??= {})[t] = svg;
  return [t, chunk];
});
writeFileSync(new URL('index.json', dir), JSON.stringify(index));
for (const [chunk, icons] of Object.entries(chunks)) writeFileSync(new URL(`${chunk}.json`, dir), JSON.stringify(icons));
console.log(`${list.length} icons in ${Object.keys(chunks).length} chunks`);
