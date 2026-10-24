// Builds the three Why-page figures (passport, driving licence, CV) as isometric scenes with the Anatomy kit
// (MIT, ./iso-kit.mjs), in the same style as the homepage desk. Writes src/why/docsFigures.ts: three static SVGs.
// The motion is CSS (src/why/docs.css); each moving part is drawn where the story ends, so a still page (reduced
// motion) shows the end of the story, and the CSS moves it in from a start offset written here as --from / --up.
// Run: node scripts/desk-hero/docs.mjs [--page=<file>]
import { writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import * as k from "./iso-kit.mjs";
import * as G from "./lathe.mjs";

const HERE = dirname(fileURLToPath(import.meta.url));
const OUT = join(HERE, "../../src/why/docsFigures.ts");

const WIDTH = 400;
const HEIGHT = 300;
const PLATE = { x: -100, y: -70, w: 200, d: 140, r: 8 };
const PLATE_H = 7;

// One projection for all three, so the plates match side by side.
const P = k.fitProjection([...k.boxCorners(PLATE, -PLATE_H - 3, 0), ...k.boxCorners({ x: -40, y: -40, w: 80, d: 40 }, 0, 44)], WIDTH, HEIGHT, { pad: 6, azimuth: 52 });

const at = (point) => k.iso(point, P);
const S = (paths, style) => k.solidSvg(paths, style);
const L = (d, style) => k.lineSvg(d, style);
const D = (points, style) => k.dotsSvg(points, style);
const fine = (v) => Math.round(v * 100) / 100;
const vec = (by) => k.axisVector(P, by).map(fine);
const px = ([x, y]) => `${x}px ${y}px`;
/** Text lying on a top face, reading along x. */
const topText = (x, y, z, text, { size = 3, cls = "", tone = "hi", anchor = "start", weight = "" } = {}) =>
  `<text class="iso-face-text ${cls}" data-tone="${tone}" transform="${k.topMatrix([x, y], z, P)}" font-size="${size}" text-anchor="${anchor}"${weight ? ` font-weight="${weight}"` : ""}>${text}</text>`;
/** Text on a face of constant y (facing the viewer, lower left), reading along x; z is the baseline. */
const sideText = (x, y, z, text, { size = 3, cls = "", tone = "hi", anchor = "start" } = {}) =>
  `<text class="iso-face-text ${cls}" data-tone="${tone}" transform="${k.sideMatrix([x, y], z, P, "left")}" font-size="${size}" text-anchor="${anchor}">${text}</text>`;
/** A flat filled shape on a top face (a portrait, a band of highlighter). */
const topRect = (x, y, z, w, d, cls, r = 0.6) => `<g transform="${k.topMatrix([x, y], z, P)}"><path class="${cls}" d="${k.pathOf(k.roundedPlan({ x: 0, y: 0, w, d, r }, 3), true)}"/></g>`;
const line = (from, to, z, tone = "lo", free = true) => L(k.lineOnTop(from, to, z, P), { tone, free });
/** A closed polygon of world points: a filled face with its outline. */
const face = (points, cls) => `<path class="${cls}" d="${k.pathOf(points.map(at), true)}"/>${L(k.pathOf(points.map(at), true), { tone: "hi" })}`;

/** The base every scene stands on: a plate with feet, an inset line and four screws, like the desk. */
function plate() {
  const out = [`<path class="iso-halo" d="${k.haloOf(PLATE, -PLATE_H - 3, PLATE_H, P)}"/>`];
  const feet = k.corners(PLATE, 16).sort((a, b) => k.depthOf([a[0], a[1], 0], P) - k.depthOf([b[0], b[1], 0], P));
  for (const [x, y] of feet) out.push(S(k.cylinder(x, y, 5, -PLATE_H - 3, 3, P, 24), { tone: "mid" }));
  out.push(S(k.slabOf(PLATE, -PLATE_H, PLATE_H, P, 8, 1.4), { tone: "mid" }));
  out.push(L(k.planOutline(k.insetPlan(PLATE, 4), 0, P), { tone: "lo" }));
  const screws = k.corners(PLATE, 9);
  out.push(L(screws.map(([x, y]) => k.ring(x, y, 1.8, 0, P, 16)).join(""), { tone: "lo" }));
  out.push(D(screws.map(([x, y]) => at([x, y, 0])), { size: 0.45 }));
  return out.join("");
}

/** A dashed route on the plate between two points. */
const route = (from, to, y) => L(k.lineOnTop([from, y], [to, y], 0, P), { tone: "mid", dashed: true, free: true });

/** A portrait block: an ink square with initials. */
const portrait = (x, y, z, w, d, size) =>
  topRect(x, y, z, w, d, "doc-ink", 0.3) + topText(x + 2, y + d - 2.4, z, "AO", { size, cls: "doc-on-ink", weight: "600" });

// ---- 1. Passport: an open booklet; a plane flies MAN → FCO along the front, then the stamp lands ----
function passport() {
  const out = [plate()];
  const cover = { x: -62, y: -62, w: 100, d: 70, r: 3 };
  const pageZ = 1.4;
  const pageTop = pageZ + 1.8;
  out.push(`<path class="iso-halo" d="${k.haloOf(cover, 0, 2, P)}"/>`);
  out.push(S(k.slabOf(cover, 0, pageZ, P, 4), { tone: "hi", className: "doc-cover" }));
  const left = { x: cover.x + 3, y: cover.y + 3, w: 46.5, d: 64, r: 1.4 };
  const right = { x: left.x + left.w + 1, y: left.y, w: 46.5, d: 64, r: 1.4 };
  out.push(S(k.slabOf(left, pageZ, 1.8, P, 3), { tone: "mid", crease: "none", className: "doc-page" }));
  out.push(S(k.slabOf(right, pageZ, 1.8, P, 3), { tone: "mid", crease: "none", className: "doc-page" }));
  // Data page: header, portrait, three fields, the machine-readable lines.
  const lx = left.x + 4;
  out.push(topRect(left.x + 1.5, left.y + 1.5, pageTop, left.w - 3, 6, "doc-ink", 0.4));
  out.push(topText(lx, left.y + 5.8, pageTop, "PASSPORT", { size: 3, cls: "doc-on-ink", tone: "hi" }));
  out.push(topText(left.x + left.w - 4, left.y + 5.8, pageTop, "GBR", { size: 3, cls: "doc-on-ink", anchor: "end" }));
  out.push(portrait(lx, left.y + 11, pageTop, 15, 19, 6));
  [["SURNAME", "OKAFOR"], ["GIVEN NAMES", "AMARA"], ["DATE OF BIRTH", "14 MAR 1991"]].forEach(([label, value], i) => {
    const y = left.y + 14 + i * 7;
    out.push(topText(lx + 19, y, pageTop, label, { size: 1.9, tone: "mid" }));
    out.push(topText(lx + 19, y + 3, pageTop, value, { size: 2.6, weight: "500" }));
  });
  out.push(line([left.x + 1.5, left.y + 50], [left.x + left.w - 1.5, left.y + 50], pageTop, "faint"));
  out.push(topText(lx, left.y + 55, pageTop, "P&lt;GBROKAFOR&lt;&lt;AMARA&lt;&lt;&lt;", { size: 2.2, tone: "mid" }));
  out.push(topText(lx, left.y + 59, pageTop, "5412873094GBR9103146F", { size: 2.2, tone: "mid" }));
  // Visa page: faint stamp boxes, and the entry stamp (moves: drops in once the plane is down).
  out.push(L([0, 1].map((i) => k.planOutline({ x: right.x + 5, y: right.y + 6 + i * 30, w: right.w - 10, d: 24, r: 1 }, pageTop, P, 3)).join(""), { tone: "faint" }));
  const sx = right.x + right.w / 2;
  const sy = right.y + 22;
  const tilt = (-12 * Math.PI) / 180;
  const turn = ([x, y]) => [sx + (x - sx) * Math.cos(tilt) - (y - sy) * Math.sin(tilt), sy + (x - sx) * Math.sin(tilt) + (y - sy) * Math.cos(tilt)];
  const stampRing = k.roundedPlan({ x: sx - 16, y: sy - 8, w: 32, d: 16, r: 1.4 }, 3).map(turn);
  const stampTop = pageTop + 0.6;
  const deg = (-12).toFixed(0);
  const stamp = [
    S(k.extrude(stampRing, pageTop, 0.6, P), { tone: "hi", crease: "none", className: "doc-stamp-solid" }),
    `<g transform="${k.topMatrix([sx, sy], stampTop, P)} rotate(${deg})">`,
    `<text class="iso-face-text doc-on-hl" x="0" y="0.2" font-size="4.2" text-anchor="middle" font-weight="600">ROMA · FCO</text>`,
    `<text class="iso-face-text doc-on-hl" x="0" y="4.6" font-size="2.8" text-anchor="middle">18 OCT 2026</text>`,
    `</g>`,
  ].join("");
  out.push(`<g class="doc-anim doc-drop" style="--up:${px(vec([0, 0, 22]))}">${stamp}</g>`);
  // Spine.
  out.push(line([right.x - 0.5, right.y], [right.x - 0.5, right.y + right.d], pageTop, "lo"));

  // Route: MAN tower, dashes, FCO tower (lights up when the plane is in).
  const RY = 42;
  out.push(route(-70, 70, RY));
  out.push(tower(-84, RY, "MAN", false));
  out.push(tower(84, RY, "FCO", true));
  out.push(plane(56, RY));
  return out.join("");
}

function tower(x, y, code, goal) {
  const out = [];
  out.push(S(k.cylinder(x, y, 2.6, 0, 12, P, 20), { tone: "hi" }));
  out.push(`<g class="${goal ? "doc-anim doc-goal" : ""}">${S(k.slabOf({ x: x - 6, y: y - 6, w: 12, d: 12, r: 2 }, 12, 4, P, 4), { tone: "hi" })}</g>`);
  out.push(topText(x, y + 14, 0, code, { size: 5, anchor: "middle", weight: "500" }));
  return out.join("");
}

/** A small airliner pointing +x, drawn landed at (x, y); it flies in from the left (--from) on an arc (--up). */
function plane(x, y) {
  const z = 4;
  const body = { x: x - 12, y: y - 2.4, w: 24, d: 4.8, r: 2.4 };
  const wing = (y0, y1) => ({ x: x - 3, y: y0, w: 8, d: y1 - y0, r: 1.2 });
  const parts = [
    S(k.slabOf(wing(y - 14, y - 2.4), z + 1.2, 0.9, P, 3), { tone: "hi" }),
    S(k.slabOf({ x: x - 12, y: y - 6, w: 4.5, d: 3.6, r: 1 }, z + 2.6, 0.7, P, 3), { tone: "hi" }),
    S(k.slabOf(body, z, 4.4, P, 6), { tone: "hi" }),
    S(k.slabOf({ x: x - 12, y: y - 0.5, w: 6, d: 1, r: 0.5 }, z + 4.4, 5, P, 3), { tone: "hi" }),
    S(k.slabOf({ x: x - 12, y: y + 2.4, w: 4.5, d: 3.6, r: 1 }, z + 2.6, 0.7, P, 3), { tone: "hi" }),
    S(k.slabOf(wing(y + 2.4, y + 14), z + 1.2, 0.9, P, 3), { tone: "hi" }),
    L(k.lineOnTop([x + 6, y - 1.4], [x + 8, y - 1.4], z + 4.4, P), { tone: "lo", free: true }),
  ].join("");
  const shadow = `<path class="doc-shadow" d="${k.pathOf(k.roundedPlan({ x: x - 10, y: y - 10, w: 16, d: 20, r: 6 }, 6).map(([px2, py]) => at([px2, py, 0])), true)}"/>`;
  return `<g class="doc-anim doc-ride" style="--from:${px(vec([-138, 0, 0]))}">${shadow}<g class="doc-anim doc-arc" style="--up:${px(vec([0, 0, 26]))}">${parts}</g></g>`;
}

// ---- 2. Licence: the card at the back; a car drives home → hospital along a road at the front ----
function licence() {
  const out = [plate()];
  const card = { x: -62, y: -62, w: 86, d: 54, r: 4 };
  const top = 1.4;
  out.push(`<path class="iso-halo" d="${k.haloOf(card, 0, 2, P)}"/>`);
  out.push(S(k.slabOf(card, 0, top, P, 6), { tone: "hi", className: "doc-page" }));
  const cx = card.x + 5;
  out.push(topText(cx, card.y + 8, top, "DRIVING LICENCE", { size: 3.4, weight: "500" }));
  out.push(topRect(card.x + card.w - 13, card.y + 4, top, 8, 5.4, "doc-ink", 0.4));
  out.push(topText(card.x + card.w - 9, card.y + 8, top, "UK", { size: 2.8, cls: "doc-on-ink", anchor: "middle" }));
  out.push(portrait(cx, card.y + 13, top, 17, 22, 7));
  [["1.", "OKAFOR"], ["2.", "AMARA"], ["3.", "14.03.1991"], ["4a.", "01.04.2016"], ["5.", "OKAFO903141A99"], ["9.", "B"]].forEach(([n, v], i) => {
    const y = card.y + 16 + i * 4.6;
    out.push(topText(cx + 22, y, top, n, { size: 2.6, tone: "mid" }));
    out.push(topText(cx + 29, y, top, v, { size: 2.6 }));
  });

  // Road along the front, with a dashed centre line.
  const road = { x: -64, y: 30, w: 128, d: 22, r: 1 };
  out.push(S(k.slabOf(road, 0, 0.6, P, 3), { tone: "lo", crease: "none", className: "doc-road" }));
  out.push(L(k.lineOnTop([road.x + 3, road.y + road.d / 2], [road.x + road.w - 3, road.y + road.d / 2], 0.6, P), { tone: "hi", dashed: true, free: true }));
  out.push(house(-86, 26));
  out.push(hospital(70, 22));
  out.push(car(44, road.y + road.d / 2 + 3.5, 0.6));
  return out.join("");
}

function house(x, y) {
  const w = 20;
  const d = 22;
  const h = 14;
  const ridge = h + 9;
  const out = [`<path class="iso-halo" d="${k.haloOf({ x, y, w, d, r: 1 }, 0, 4, P)}"/>`];
  out.push(S(k.slabOf({ x, y, w, d, r: 0.6 }, 0, h, P, 2), { tone: "hi" }));
  // Door and window on the front face (constant y = y + d).
  out.push(`<g transform="${k.sideMatrix([0, y + d], 0, P, "left")}">${L(k.pathOf(k.roundedPlan({ x: x + 4, y: 0, w: 5, d: 8, r: 0.4 }, 2).map(([u, z]) => [u, -z])), { tone: "hi" })}${L(k.pathOf(k.roundedPlan({ x: x + 12, y: 6, w: 5, d: 4.6, r: 0.4 }, 2).map(([u, z]) => [u, -z]), true), { tone: "hi" })}</g>`);
  // Gable roof, ridge along x, overhanging a little: back slope, front slope, the gable end on the right.
  const o = 1.5;
  const y0 = y - o;
  const y1 = y + d + o;
  const ym = y + d / 2;
  const x0 = x;
  const x1 = x + w;
  out.push(face([[x0, y0, h - 1], [x1, y0, h - 1], [x1, ym, ridge], [x0, ym, ridge]], "iso-top"));
  out.push(face([[x0, ym, ridge], [x1, ym, ridge], [x1, y1, h - 1], [x0, y1, h - 1]], "doc-roof"));
  out.push(face([[x + w, y, h], [x + w, ym, ridge - 1], [x + w, y + d, h]], "iso-shade\" data-shade=\"2"));
  return out.join("");
}

function hospital(x, y) {
  const w = 26;
  const d = 30;
  const h = 32;
  const out = [`<path class="iso-halo" d="${k.haloOf({ x, y, w, d, r: 1 }, 0, 6, P)}"/>`];
  out.push(S(k.slabOf({ x, y, w, d, r: 1 }, 0, h, P, 3), { tone: "hi" }));
  // Windows on the front face, a door in the middle.
  const front = [];
  for (const z of [12, 19, 26]) for (const u of [x + 3, x + 10.5, x + 18]) front.push(k.pathOf(k.roundedPlan({ x: u, y: z, w: 5, d: 4, r: 0.3 }, 2).map(([a, b]) => [a, -b]), true));
  front.push(k.pathOf(k.roundedPlan({ x: x + 9.5, y: 0, w: 7, d: 8, r: 0.3 }, 2).map(([a, b]) => [a, -b])));
  out.push(`<g transform="${k.sideMatrix([0, y + d], 0, P, "left")}">${L(front.join(""), { tone: "hi" })}</g>`);
  // The cross on the roof: lights up highlight yellow when the car arrives.
  const c = [x + w / 2, y + d / 2];
  const a = 3;
  const b = 9;
  const plus = [[-a, -b], [a, -b], [a, -a], [b, -a], [b, a], [a, a], [a, b], [-a, b], [-a, a], [-b, a], [-b, -a], [-a, -a]].map(([u, v]) => [c[0] + u, c[1] + v]);
  out.push(`<g class="doc-anim doc-goal">${S(k.extrude(plus, h, 1.6, P, { convex: false }), { tone: "hi", crease: "none" })}</g>`);
  return out.join("");
}

/** A small car pointing +x, drawn arrived at (x, y); it drives in from the house (--from). */
function car(x, y, z0) {
  const r = 2.6;
  const zc = z0 + r;
  const wheel = (wx, wy) => S(G.solidOf([[0, r], [1.8, r]], G.frameAlong([wx, wy, zc], [0, 1, 0]), P), { tone: "hi" });
  const hub = (wx, wy) => L(k.pathOf(Array.from({ length: 13 }, (_, i) => at([wx + Math.cos((i / 12) * Math.PI * 2) * 1, wy, zc + Math.sin((i / 12) * Math.PI * 2) * 1])), true), { tone: "lo", free: true });
  const back = y - 5.2;
  const front = y + 5.2;
  const parts = [
    wheel(x - 6.5, back - 1.8),
    wheel(x + 6.5, back - 1.8),
    S(k.slabOf({ x: x - 11, y: y - 5.2, w: 22, d: 10.4, r: 2 }, zc - 0.6, 4.6, P, 4), { tone: "hi" }),
    S(k.slabOf({ x: x - 6, y: y - 4.4, w: 11, d: 8.8, r: 2 }, zc + 4, 4.2, P, 4), { tone: "hi", className: "doc-cabin" }),
    wheel(x - 6.5, front),
    wheel(x + 6.5, front),
    hub(x - 6.5, front + 1.8),
    hub(x + 6.5, front + 1.8),
  ].join("");
  return `<g class="doc-anim doc-ride" style="--from:${px(vec([-104, 0, 0]))}">${parts}</g>`;
}

// ---- 3. CV: the page lies on the plate; a highlighter marks the result, then the interview invite stands up ----
function cv() {
  const out = [plate()];
  const sheet = { x: -72, y: -64, w: 72, d: 102, r: 0.6 };
  const top = 0.8;
  out.push(`<path class="iso-halo" d="${k.haloOf(sheet, 0, 2, P)}"/>`);
  out.push(S(k.slabOf(sheet, 0, top, P, 2), { tone: "hi", crease: "none", className: "doc-page" }));
  const sx = sheet.x + 6;
  const sy = sheet.y;
  out.push(portrait(sx, sy + 6, top, 12, 12, 5));
  out.push(topText(sx + 15, sy + 11, top, "Amara Okafor", { size: 5.4, cls: "doc-title", weight: "600" }));
  out.push(topText(sx + 15, sy + 16, top, "Registered Nurse", { size: 2.8, tone: "mid" }));
  out.push(topText(sx, sy + 24, top, "MANCHESTER, UK", { size: 2.2, tone: "mid" }));
  out.push(line([sx, sy + 27], [sheet.x + sheet.w - 6, sy + 27], top, "hi", false));
  out.push(topText(sx, sy + 32, top, "WORK EXPERIENCE", { size: 2.2, tone: "mid" }));
  out.push(topText(sx, sy + 37, top, "Staff Nurse, Emergency", { size: 3, weight: "600", cls: "doc-title" }));
  // The highlighted result: a yellow band that grows under the line as the pen passes.
  const band = { x: sx - 1, y: sy + 39.6, w: 52, d: 5.2 };
  out.push(topRect(band.x, band.y, top, band.w, band.d, "doc-hl doc-anim doc-mark", 0.3));
  out.push(topText(sx, sy + 43.6, top, "Cut handover errors by 25%", { size: 3 }));
  for (const [v, w] of [[50, 54], [54, 40], [62, 50], [66, 30]]) out.push(line([sx, sy + v], [sx + w, sy + v], top, "lo"));
  out.push(line([sx, sy + 72], [sheet.x + sheet.w - 6, sy + 72], top, "hi", false));
  out.push(topText(sx, sy + 77, top, "SKILLS", { size: 2.2, tone: "mid" }));
  [["Triage", 12], ["Patient assessment", 27], ["IV therapy", 15]].reduce((u, [name, w]) => {
    out.push(L(k.planOutline({ x: u, y: sy + 80, w, d: 5, r: 2.5 }, top, P, 4), { tone: "hi" }));
    out.push(topText(u + w / 2, sy + 83.6, top, name, { size: 2.3, anchor: "middle" }));
    return u + w + 2;
  }, sx);
  out.push(highlighter(band.x + band.w, band.y + band.d / 2, top, band.w));
  out.push(invite(30, 4));
  return out.join("");
}

/** A highlighter resting at the end of the band, tilted up and back; it sweeps in from the band's start. */
function highlighter(x, y, z, sweep) {
  const dir = k3unit([0.85, 0.22, 0.48]);
  const F = G.frameAlong([x, y, z + 0.4], dir);
  const parts = [
    S(G.solidOf([[0, 0.9], [2.2, 2.2], [6, 2.8]], F, P), { tone: "hi", className: "doc-hl-solid" }),
    S(G.solidOf([[6, 3.1], [24, 3.1], [26, 2.6]], F, P), { tone: "hi" }),
    S(G.solidOf([[24, 3.3], [34, 3.3], [35, 2.4]], F, P), { tone: "hi", className: "doc-hl-solid" }),
  ].join("");
  return `<g class="doc-anim doc-sweep" style="--from:${px(vec([-sweep, 0, 0]))}">${parts}</g>`;
}
function k3unit([a, b, c]) {
  const n = Math.hypot(a, b, c);
  return [a / n, b / n, c / n];
}

/** A desk calendar with the interview on it. Its words are filled in per language (INVITE / WHEN). */
function invite(x, y) {
  const w = 52;
  const d = 26;
  const h = 34;
  const out = [`<path class="iso-halo" d="${k.haloOf({ x, y, w, d, r: 2 }, 0, 6, P)}"/>`];
  out.push(S(k.slabOf({ x, y, w, d, r: 2 }, 0, h, P, 4), { tone: "hi" }));
  const fy = y + d;
  // Header band in ink with the word, then the date and time on the page below it.
  out.push(`<g transform="${k.sideMatrix([0, fy], 0, P, "left")}"><path class="doc-ink" d="${k.pathOf(k.roundedPlan({ x: x + 2, y: h - 11, w: w - 4, d: 9, r: 0.6 }, 2).map(([a, b]) => [a, -b]), true)}"/></g>`);
  out.push(sideText(x + 6, fy, h - 8.6, "%INVITE%", { size: 4.4, cls: "doc-on-ink" }));
  out.push(sideText(x + 6, fy, h - 20, "%WHEN%", { size: 4.6, cls: "doc-title" }));
  out.push(`<g transform="${k.sideMatrix([0, fy], 0, P, "left")}">${L(`M${x + 6} ${-(h - 24)}H${x + w - 6}M${x + 6} ${-(h - 28)}H${x + w - 16}`, { tone: "lo", free: true })}</g>`);
  // Binding rings on top.
  for (const u of [x + 12, x + w - 12]) out.push(S(k.cylinder(u, y + d / 2, 2.2, h, 1.6, P, 16), { tone: "hi" }));
  // A check on the top: done, it's booked.
  out.push(`<path class="doc-check" d="${k.pathOf([at([x + w / 2 - 5, y + d / 2 + 1, h]), at([x + w / 2 - 1.5, y + d / 2 + 4, h]), at([x + w / 2 + 6, y + d / 2 - 4, h])])}"/>`);
  return `<g class="doc-anim doc-drop" style="--up:${px(vec([0, 0, 30]))}">${out.join("")}</g>`;
}

const figure = (label, body) => k.figureSvg({ width: WIDTH, height: HEIGHT, label, body });
const figures = {
  PASSPORT_SVG: figure("An isometric drawing of an open passport; a small plane flies from MAN to FCO and an entry stamp for Rome lands on the page.", passport()),
  LICENCE_SVG: figure("An isometric drawing of a driving licence; a small car drives along a road from a house to a hospital.", licence()),
  CV_SVG: figure("An isometric drawing of a CV lying on a plate; a highlighter marks a result and a desk calendar shows the interview.", cv()),
};

const file = `// Generated by scripts/desk-hero/docs.mjs. Do not edit by hand: change the build and run it again.
/* eslint-disable */
${Object.entries(figures).map(([name, svg]) => `export const ${name} = ${JSON.stringify(svg)};`).join("\n")}
`;
writeFileSync(OUT, file);
const pageAt = process.argv.find((a) => a.startsWith("--page="));
if (pageAt) {
  const body = Object.values(figures).map((svg, i) => k.plateHtml({ fig: `Fig ${i + 1}`, title: "Docs", hint: "", body: `<div class="iso-stage">${svg.replace("%INVITE%", "INTERVIEW").replace("%WHEN%", "Tue, 10:00")}</div>` })).join("");
  writeFileSync(pageAt.slice(7), k.pageHtml({ title: "Docs", theme: "light", body }));
}
console.log(`wrote ${OUT} (${(file.length / 1024).toFixed(0)} KB)`);
