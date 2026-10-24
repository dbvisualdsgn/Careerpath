// Builds the homepage hero: an isometric 1984 desk (computer, keyboard, mouse, coffee, printer) drawn once
// with the Anatomy kit (MIT, ./iso-kit.mjs). Writes src/home/desk/deskFigure.ts: the static SVG plus the
// screen vectors the live code needs, so the page never loads the kit. Run: node scripts/desk-hero/build.mjs
import { writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import * as k from "./iso-kit.mjs";
import * as G from "./lathe.mjs";

const HERE = dirname(fileURLToPath(import.meta.url));
const OUT = join(HERE, "../../src/home/desk/deskFigure.ts");

const WIDTH = 760;
const HEIGHT = 620;

// ---- World (units ≈ 1 px of the real thing; x right, y toward the viewer, z up) ----
const DESK = { x: -150, y: -98, w: 352, d: 284, r: 10 };
const DESK_H = 10;
const FOOT_H = 5;

const CASE = { x: -62, y: -62, w: 124, d: 118, r: 8 };
const FRONT = CASE.y + CASE.d;
const SIDE = CASE.x + CASE.w;
const PLINTH_H = 5;
const TOP = 170;
const SEAM = FRONT - 12;
const BEZEL = { x0: -48, x1: 48, z0: 68, z1: 158, r: 6, depth: 1.6 };
const CRT = { x0: -40, x1: 40, z0: 77, z1: 150, r: 8, depth: 5 };
const SLOT = { x0: 8, x1: 46, z0: 45, z1: 50.5, r: 2.4, depth: 4 };

const KB = { x: -76, y: 84, w: 152, d: 58, r: 4 };
const KB_Z = 1.6;
const KB_TOP = 8.6;
const U = 9.2;
const KEYS_X = -U * 7.5;
const KEYS_Y = 88.5;
const ROWS = [
  [["`", 1], ["1", 1], ["2", 1], ["3", 1], ["4", 1], ["5", 1], ["6", 1], ["7", 1], ["8", 1], ["9", 1], ["0", 1], ["-", 1], ["=", 1], ["Backspace", 2]],
  [["Tab", 1.5], ["q", 1], ["w", 1], ["e", 1], ["r", 1], ["t", 1], ["y", 1], ["u", 1], ["i", 1], ["o", 1], ["p", 1], ["[", 1], ["]", 1], ["\\", 1.5]],
  [["CapsLock", 1.75], ["a", 1], ["s", 1], ["d", 1], ["f", 1], ["g", 1], ["h", 1], ["j", 1], ["k", 1], ["l", 1], [";", 1], ["'", 1], ["Enter", 2.25]],
  [["Shift", 2.25], ["z", 1], ["x", 1], ["c", 1], ["v", 1], ["b", 1], ["n", 1], ["m", 1], [",", 1], [".", 1], ["/", 1], ["ShiftRight", 2.75]],
  [["Alt", 1.5], ["Meta", 1.5], [" ", 9], ["NumpadEnter", 1.5], ["AltRight", 1.5]],
];
const ROW_H = [5.6, 5.2, 4.8, 4.4, 4];

// Printer to the right, set back; its output tray reaches toward the viewer and holds the printed pile.
const PR = { x: 92, y: -86, w: 100, d: 70, r: 6 };
const PR_FRONT = PR.y + PR.d;
const PR_SIDE = PR.x + PR.w;
const PR_PLINTH = 3;
const PR_TOP = 34;
const PR_SLOT = { x0: PR.x + 12, x1: PR.x + PR.w - 12, z0: 15, z1: 19.5, r: 1.6, depth: 3 };
const SHEET = { x: PR.x + 18, w: 64, d: 86 };
const TRAY = { x: PR.x + 14, y: PR_FRONT - 4, w: 72, d: 94, r: 2.4 };
const TRAY_Z = 1.2;
const SHEET_T = 0.7;
const PILE_MAX = 5;
const PILE_Y = TRAY.y + 5;
const SLOT_Z = 16.2;
// A real pile is never square: each sheet lands a little off the one under it.
const PILE_OFF = [[0, 0], [1.8, -1.4], [-1.2, 1.2], [2.4, 0.6], [-0.4, -1.8]];
const PILE_STEP = 1.1;

const PAD = { x: 104, y: 124, w: 70, d: 54, r: 4 };
const MOUSE = { x: 132, y: 142, w: 15, d: 23, r: 6.8 };
const MOUSE_Z = 1.2;
const MOUSE_H = 6.4;

const CUP = { x: -110, y: 74 };
// Pen holder behind the cup: a ballpoint, a black fineliner, a yellow highlighter and a pencil.
const HOLDER = { x: -126, y: 10, r: 10, h: 26 };
const STEAM_SEGS = 12;
const STEAM_H = 34;
const MOUSE_CORD = [[MOUSE.x + MOUSE.w / 2, MOUSE.y + 1, 2.6], [MOUSE.x + 5, MOUSE.y - 12, 1.9], [MOUSE.x - 8, MOUSE.y - 20, 1.6], [96, 120, 1.6], [KB.x + KB.w + 3, 128, 3], [KB.x + KB.w, 128, 4.2]];

const PORT = { y: 28, z: 9 };
const COIL = { x: 80, z: 3.6, r: 3.2, from: 44, to: 84, turns: 17 };

const P = k.fitProjection(
  [...k.boxCorners(DESK, -DESK_H - FOOT_H, 0), ...k.boxCorners(CASE, 0, TOP), ...k.boxCorners(PR, 0, 76)],
  WIDTH,
  HEIGHT,
  { pad: 6, azimuth: 52 },
);

const at = (point) => k.iso(point, P);
const S = (paths, style) => k.solidSvg(paths, style);
const L = (d, style) => k.lineSvg(d, style);
const D = (points, style) => k.dotsSvg(points, style);
const byDepth = (points) => [...points].sort((a, b) => k.depthOf([a[0], a[1], 0], P) - k.depthOf([b[0], b[1], 0], P));
const planeOf = (y) => k.sideMatrix([0, y], 0, P, "left");
const flat = (x0, z0, x1, z1, r, steps = 6) => k.pathOf(k.roundedPlan({ x: x0, y: z0, w: x1 - x0, d: z1 - z0, r }, steps).map(([u, z]) => [u, -z]), true);
const sideSlot = (x, y, z0, z1, half = 0.8) => k.pathOf(k.roundedPlan({ x: y - half, y: z0, w: half * 2, d: z1 - z0, r: half }, 4).map(([u, z]) => at([x, u, z])), true);
const rowOf = (from, to, step) => Array.from({ length: Math.floor((to - from) / step + 1e-9) + 1 }, (_, i) => from + i * step);

let clips = 0;
/** A window set into a face of constant y, with its walls drawn and whatever lies behind clipped to it. */
function recess({ x0, x1, z0, z1, r, depth }, y, back = "", backClass = "dk-well", inside = "") {
  const id = `dk-clip-${clips++}`;
  const ring = k.roundedPlan({ x: x0, y: z0, w: x1 - x0, d: z1 - z0, r }, 6);
  const cx = (x0 + x1) / 2;
  const cz = (z0 + z1) / 2;
  const { sinA } = k.cameraOf(P);
  const tops = [];
  const sides = [[], [], [], []];
  ring.forEach(([ax, az], index) => {
    const [bx, bz] = ring[(index + 1) % ring.length];
    const length = Math.hypot(bx - ax, bz - az) || 1;
    let [nx, nz] = [(bz - az) / length, -(bx - ax) / length];
    if (nx * (cx - (ax + bx) / 2) + nz * (cz - (az + bz) / 2) < 0) [nx, nz] = [-nx, -nz];
    if (nx <= 0 && nz <= 0) return;
    const quad = k.pathOf([at([ax, y, az]), at([bx, y, bz]), at([bx, y - depth, bz]), at([ax, y - depth, az])], true);
    if (nz >= nx) tops.push(quad);
    else sides[Math.min(3, Math.max(0, Math.floor(((nx * -sinA + 1) / 2) * 4)))].push(quad);
  });
  const shape = flat(x0, z0, x1, z1, r);
  return [
    `<clipPath id="${id}"><path transform="${planeOf(y)}" d="${shape}"/></clipPath>`,
    `<g clip-path="url(#${id})">`,
    `<path class="iso-top" d="${tops.join("")}"/>`,
    ...sides.map((d, shade) => (d.length ? `<path class="iso-shade" data-shade="${shade}" d="${d.join("")}"/>` : "")),
    `<g transform="${planeOf(y - depth)}"><path class="${backClass}" d="${shape}"/>${back}<path class="iso-line" data-tone="faint" d="${shape}"/></g>`,
    inside,
    `</g>`,
    `<g transform="${planeOf(y)}"><path class="iso-line" data-tone="lo" d="${shape}"/></g>`,
  ].join("");
}

// ---- Desk ----
function desk() {
  const out = [`<path class="iso-halo" d="${k.haloOf(DESK, -DESK_H - FOOT_H, DESK_H, P)}"/>`];
  for (const [x, y] of byDepth(k.corners(DESK, 24))) {
    out.push(S(k.cylinder(x, y, 7, -DESK_H - FOOT_H, 1.6, P, 28), { tone: "lo" }));
    out.push(S(k.cylinder(x, y, 5.4, -DESK_H - FOOT_H + 1.6, FOOT_H - 1.6, P, 28), { tone: "mid" }));
  }
  out.push(S(k.slabOf(DESK, -DESK_H, DESK_H, P, 8, 1.6), { tone: "mid" }));
  out.push(L(k.planOutline(k.insetPlan(DESK, 5), 0, P), { tone: "lo" }));
  const screws = k.corners(DESK, 11);
  out.push(L(screws.map(([x, y]) => k.ring(x, y, 2.2, 0, P, 16)).join(""), { tone: "lo" }));
  out.push(D(screws.map(([x, y]) => at([x, y, 0])), { size: 0.5 }));
  // Label plate, front right.
  const label = { x: DESK.x + 14, y: DESK.y + 14, w: 40, d: 9, r: 1.2 };
  out.push(S(k.slabOf(label, 0, 0.8, P, 3), { tone: "lo", crease: "none" }));
  out.push(L([30, 22].map((w, i) => k.lineOnTop([label.x + 4, label.y + 3 + i * 3], [label.x + 4 + w, label.y + 3 + i * 3], 0.8, P)).join(""), { tone: "lo", free: true }));
  out.push(D([at([label.x + label.w - 3, label.y + label.d / 2, 0.8])], { size: 0.45 }));
  return out.join("");
}

// ---- The computer and its screen ----
const CV_X = CRT.x0 + 6;
const BUTTONS = [
  { id: "share", label: "Share", x0: -34, x1: -14 },
  { id: "pdf", label: "PDF", x0: -11, x1: 6 },
  { id: "print", label: "Print", x0: 9, x1: 34 },
];
const BTN = { z0: 82, z1: 90 };
function screen() {
  const lines = [];
  for (let z = CRT.z0 + 1.2; z < CRT.z1; z += 1.6) lines.push(`M${CRT.x0} ${(-z).toFixed(1)}H${CRT.x1}`);
  const glow = flat(-30, CRT.z0 + 8, 30, CRT.z1 - 8, 26, 10);
  const text = (part, z, size, cls) => `<text class="${cls}" data-part="${part}" x="${CV_X}" y="${-z}" font-size="${size}"></text>`;
  const buttons = BUTTONS.map(
    (b) =>
      `<g class="dk-btn" data-btn="${b.id}"><path class="dk-btn-face" d="${flat(b.x0, BTN.z0, b.x1, BTN.z1, 1.2, 4)}"/><text class="dk-btn-text" x="${(b.x0 + b.x1) / 2}" y="${-(BTN.z0 + 2.4)}" font-size="3.6" text-anchor="middle">${b.label}</text></g>`,
  ).join("");
  const crt = [
    `<path class="dk-glow" d="${glow}"/>`,
    `<path class="dk-scan" d="${lines.join("")}"/>`,
    text("name", 138, 6.4, "dk-text dk-name"),
    text("headline", 131, 3.8, "dk-text"),
    `<path class="dk-rule" data-part="rule" d="M${CV_X} ${-127}H${CRT.x1 - 6}" style="opacity:0"/>`,
    text("label", 121.5, 2.8, "dk-text dk-label"),
    text("role1", 115.5, 3.3, "dk-text"),
    text("role2", 109.5, 3.3, "dk-text"),
    text("skills", 101.5, 3.3, "dk-text"),
    `<rect class="dk-cursor" data-part="cursor" x="${CV_X}" y="${-138 - 5}" width="3" height="5.6"/>`,
    `<g data-part="buttons" style="opacity:0">${buttons}</g>`,
    `<g data-part="pointer" style="opacity:0"><path class="dk-pointer" d="M0 0L0 8.4L2.2 6.4L3.9 10.2L5.3 9.6L3.6 5.8L6.4 5.6Z"/></g>`,
  ].join("");
  const back = [
    `<g data-part="crt">${crt}</g>`,
  ].join("");
  return recess(BEZEL, FRONT, "", "dk-bezel", recess(CRT, FRONT - BEZEL.depth, back, "dk-glass"));
}

function computer() {
  const out = [`<path class="iso-halo" d="${k.haloOf(CASE, 0, 8, P)}"/>`];
  out.push(S(k.slabOf(k.insetPlan(CASE, 3), 0, PLINTH_H, P, 8), { tone: "lo" }));
  out.push(S(k.slabOf(CASE, PLINTH_H, TOP - PLINTH_H, P, 8, 1.6), { tone: "mid" }));
  const handle = { x: -42, y: CASE.y + 7, w: 84, d: 11, r: 5.5 };
  out.push(L(k.planOutline(handle, TOP, P, 8), { tone: "lo" }));
  out.push(L(k.planOutline(k.insetPlan(handle, 2.2), TOP, P, 8), { tone: "faint" }));
  out.push(L(Array.from({ length: 7 }, (_, i) => k.planOutline({ x: -34, y: CASE.y + 27.3 + i * 3.4, w: 68, d: 1.4, r: 0.7 }, TOP, P, 4)).join(""), { tone: "faint" }));
  out.push(L(k.lineOnTop([CASE.x, SEAM], [SIDE, SEAM], TOP, P) + k.segment([SIDE, SEAM, TOP], [SIDE, SEAM, PLINTH_H], P), { tone: "lo" }));
  out.push(L(rowOf(CASE.y + 10, CASE.y + 52, 3.2).map((y) => sideSlot(SIDE, y, TOP - 48, TOP - 14)).join(""), { tone: "faint" }));
  out.push(L(rowOf(CASE.y + 10, CASE.y + 40, 3.2).map((y) => sideSlot(SIDE, y, 20, 30)).join(""), { tone: "faint" }));
  out.push(`<g transform="${planeOf(FRONT)}"><path class="iso-line" data-tone="faint" d="${flat(CASE.x + 4, PLINTH_H + 4, SIDE - 4, TOP - 4, 5)}"/></g>`);
  out.push(screen());
  out.push(recess(SLOT, FRONT, `<path class="iso-line" data-tone="lo" d="M${SLOT.x0} ${-(SLOT.z0 + 1.6)}H${SLOT.x1}"/>`, "dk-dark"));
  out.push(D([at([SLOT.x1 + 4, FRONT, SLOT.z0 - 1])], { size: 0.5, tone: "mid" }));
  out.push(`<g transform="${planeOf(FRONT)}">${L(Array.from({ length: 9 }, (_, i) => flat(-46.7 + i * 3, 42, -45.3 + i * 3, 54, 0.7, 4)).join(""), { tone: "lo" })}</g>`);
  out.push(D([at([-46, FRONT, 36])], { size: 0.8, tone: "hi" }));
  // Rocker switch and the keyboard port on the right side.
  const y = CASE.y + 8;
  out.push(S(k.slabOf({ x: SIDE, y, w: 1.2, d: 12, r: 1 }, 12, 15, P, 3), { tone: "mid" }));
  out.push(S(k.slabOf({ x: SIDE + 1.2, y: y + 1.5, w: 2.4, d: 9, r: 0.6 }, 13, 5.6, P, 2), { tone: "mid" }));
  out.push(S(k.slabOf({ x: SIDE + 1.2, y: y + 1.5, w: 0.8, d: 9, r: 0.6 }, 20.4, 5.6, P, 2), { tone: "mid" }));
  out.push(S(k.slabOf({ x: SIDE - 0.4, y: PORT.y - 1, w: 1.4, d: 10, r: 1 }, PORT.z - 1, 9, P, 3), { tone: "lo" }));
  out.push(S(k.slabOf({ x: SIDE + 1, y: PORT.y, w: 4.4, d: 8, r: 1 }, PORT.z, 7, P, 3, 0.4), { tone: "mid" }));
  out.push(S(k.slabOf({ x: SIDE + 5.4, y: PORT.y + 2, w: 5, d: 4, r: 1.6 }, PORT.z + 1.5, 4, P, 4), { tone: "mid" }));
  out.push(D([at([SIDE + 3.2, PORT.y + 1.6, PORT.z + 7]), at([SIDE + 3.2, PORT.y + 6.4, PORT.z + 7])], { size: 0.4 }));
  return out.join("");
}

const keyList = [];
function keyboard() {
  const out = [`<path class="iso-halo" d="${k.haloOf(KB, 0, 4, P)}"/>`];
  for (const [x, y] of byDepth(k.corners(KB, 8))) out.push(S(k.cylinder(x, y, 2.8, 0, KB_Z, P, 16), { tone: "lo" }));
  out.push(S(k.slabOf(KB, KB_Z, KB_TOP - KB_Z, P, 6, 1), { tone: "mid" }));
  const well = { x: KEYS_X - 1.4, y: KEYS_Y - 1.4, w: U * 15 + 2.8, d: U * 5 + 2.8, r: 2 };
  out.push(L(k.planOutline(well, KB_TOP, P, 4), { tone: "lo" }));
  out.push(D([at([KB.x + 4, KB.y + 2.4, KB_TOP]), at([KB.x + KB.w - 4, KB.y + 2.4, KB_TOP])], { size: 0.45 }));
  ROWS.forEach((row, r) => {
    let x = KEYS_X;
    for (const [code, width] of row) {
      const plan = { x: x + 0.7, y: KEYS_Y + r * U + 0.7, w: width * U - 1.4, d: U - 1.4, r: 1.4 };
      const h = ROW_H[r];
      const index = keyList.length;
      keyList.push(code);
      const dish = k.planOutline(k.insetPlan(plan, code === " " ? 1.8 : 1.6), KB_TOP + h, P, 3);
      out.push(`<g class="dk-key" data-key="${index}">${S(k.slabOf(plan, KB_TOP, h, P, 3, 0.4), { tone: "mid", crease: "faint" })}${L(dish, { tone: "faint" })}</g>`);
      x += width * U;
    }
  });
  out.push(S(k.slabOf({ x: KB.x + KB.w, y: 90, w: 4, d: 4, r: 1.5 }, 2.5, 4, P, 4), { tone: "mid" }));
  return out.join("");
}

function keyboardCord() {
  const curve = (points) => k.pathOf(points.map((point) => at(point)));
  const start = [COIL.x + COIL.r, COIL.from, COIL.z];
  const end = [COIL.x + COIL.r, COIL.to, COIL.z];
  const spring = k.coil(COIL.from, COIL.to, [COIL.x, COIL.z], COIL.r, COIL.turns, "y", P);
  return [
    `<path class="iso-line dk-cord" data-tone="mid" d="${curve([[SIDE + 10.4, PORT.y + 4, PORT.z + 3.5], [SIDE + 14, PORT.y + 6, PORT.z + 2.4], [SIDE + 17, PORT.y + 9.5, PORT.z - 1], [SIDE + 19.6, PORT.y + 13, COIL.z + 1.6], start])}"/>`,
    L(spring.back, { tone: "lo" }),
    L(spring.front, { tone: "mid" }),
    `<path class="iso-line dk-cord" data-tone="mid" d="${curve([end, [COIL.x + 2.6, COIL.to + 3, COIL.z + 0.2], [KB.x + KB.w + 6.4, 91.4, 4.4], [KB.x + KB.w + 4, 92, 4.5]])}"/>`,
  ].join("");
}

// ---- Mouse on its pad ----
function mouse() {
  const out = [];
  out.push(S(k.slabOf(PAD, 0, MOUSE_Z, P, 6), { tone: "lo", crease: "none" }));
  out.push(L(k.planOutline(k.insetPlan(PAD, 2.4), MOUSE_Z, P, 6), { tone: "faint" }));
  // Cord from the mouse's nose, across the pad, to the keyboard's right side.
  // The live code redraws this cord as the mouse moves: its first point follows the mouse, the rest less and less.
  out.push(`<path class="iso-line dk-cord" data-tone="mid" data-part="mcord" d="${k.pathOf(MOUSE_CORD.map(at))}"/>`);
  out.push(S(k.slabOf({ x: KB.x + KB.w, y: 126, w: 3, d: 4, r: 1.2 }, 2.6, 3.4, P, 4), { tone: "mid" }));
  const body = [`<path class="iso-halo" d="${k.haloOf(MOUSE, MOUSE_Z, 4, P)}"/>`];
  body.push(S(k.slabOf(MOUSE, MOUSE_Z, MOUSE_H, P, 8, 1.4), { tone: "mid" }));
  const z = MOUSE_Z + MOUSE_H;
  body.push(`<g data-part="mbutton">${S(k.slabOf({ x: MOUSE.x + 1.6, y: MOUSE.y + 1.6, w: MOUSE.w - 3.2, d: 8, r: 4.6 }, z, 0.6, P, 6), { tone: "mid", crease: "none" })}</g>`);
  body.push(D([at([MOUSE.x + MOUSE.w / 2, MOUSE.y + MOUSE.d - 5, z])], { size: 0.45 }));
  out.push(`<g data-part="mouse">${body.join("")}</g>`);
  return out.join("");
}

// ---- Pen holder ----
// One pen: a solid of revolution along a tilted axis from inside the holder. `parts` are [from, to, radius,
// class] bands along the axis, so a pen is built like a real one: barrel, grip, cap, tip.
function pen(base, dir, parts, cls) {
  const F = G.frameAlong(base, dir);
  return `<g class="${cls}">${parts.map(([a, b, r0, r1 = r0]) => S(G.solidOf([[a, r0, 1], [b, r1, 1]], F, P, { steps: 16 }), { tone: "mid", flat: true, crease: "none" })).join("")}</g>`;
}
function holder() {
  const { x, y, r, h } = HOLDER;
  const out = [`<path class="iso-halo" d="${k.haloOf({ x: x - r, y: y - r, w: 2 * r, d: 2 * r, r }, 0, 3, P)}"/>`];
  // Base ring, body, and the dark opening on top.
  out.push(S(G.solidOf([[0, r + 1.2, 1], [1.4, r + 1.2, 1]], G.frameAlong([x, y, 0], [0, 0, 1]), P), { tone: "mid", flat: true, crease: "none" }));
  out.push(S(G.solidOf([[1.4, r, 1], [h, r, 1]], G.frameAlong([x, y, 0], [0, 0, 1]), P), { tone: "mid", flat: true, crease: "none" }));
  const opening = k.onTop(k.circleRing(x, y, r - 1.2, 48), h, P, true);
  out.push(`<path class="dk-hole" d="${opening}"/>`);
  out.push(L(k.ring(x, y, r - 1.2, h, P, 48), { tone: "mid", flat: true, crease: "none" }));
  // The pens show above the rim and through the opening, never through the holder's wall.
  const wall = [];
  for (let i = 0; i < 48; i++) {
    const a = (i / 48) * Math.PI * 2;
    wall.push(at([x + Math.cos(a) * r, y + Math.sin(a) * r, 0]), at([x + Math.cos(a) * r, y + Math.sin(a) * r, h]));
  }
  const mask = `<mask id="dk-pen-mask" maskUnits="userSpaceOnUse" x="0" y="0" width="${WIDTH}" height="${HEIGHT}"><rect width="${WIDTH}" height="${HEIGHT}" fill="#fff"/><path d="${k.pathOf(hullOf(wall), true)}" fill="#000"/><path d="${opening}" fill="#fff"/></mask>`;
  const pens = [
    // Pencil, leaning back left: barrel, sharpened cone, graphite point.
    pen([x - 3.6, y + 2, 3], [-0.34, -0.12, 1], [[0, 46, 1.35], [46, 51.5, 1.35, 0.45], [51.5, 53, 0.45, 0.05]], "dk-pencil"),
    // Black fineliner, leaning back and a little right (clear of the computer): barrel, grip and a long fine tip.
    pen([x + 2.6, y - 3, 3], [-0.1, -0.34, 1], [[0, 34, 1.7], [34, 41, 1.5], [41, 44.5, 1.5, 0.6], [44.5, 47, 0.35]], "dk-black"),
    // Ballpoint, nearly upright, leaning away: slim barrel, cone and a ball.
    pen([x - 1.2, y - 4.4, 3], [-0.12, -0.36, 1], [[0, 44, 1.2], [44, 48, 1.2, 0.5], [48, 49.5, 0.3]], "dk-biro"),
    // Highlighter in front, almost upright so it rises clear of the rim: thick yellow barrel and its cap.
    pen([x + 1.2, y + 3.4, 3], [-0.1, -0.14, 1], [[0, 30, 2.7], [30, 41, 2.9], [41, 42.4, 2.9, 2.2]], "dk-marker"),
  ];

  out.push(`${mask}<g mask="url(#dk-pen-mask)">${pens.join("")}</g>`);
  // Flat outline style, like the rest of the desk: one tone per face, no smooth sheen (desk.css, .dk-flat).
  return `<g class="dk-flat">${out.join("")}</g>`;
}

// ---- Coffee ----
function coffee() {
  const out = [];
  const { x, y } = CUP;
  out.push(`<path class="iso-halo" d="${k.haloOf({ x: x - 18, y: y - 18, w: 36, d: 36, r: 18 }, 0, 3, P)}"/>`);
  out.push(S(k.cylinder(x, y, 18, 0, 1.4, P, 40, 0.4), { tone: "mid", flat: true, crease: "none" }));
  out.push(L(k.ring(x, y, 12.4, 1.4, P, 40), { tone: "faint" }));
  // The handle stands in the plane of the cup's axis, on the side facing right; two faces give it thickness.
  const handle = (dy) => {
    const ring = "M10.2 -4.6C19.4 -4.6 19.4 -15.8 10.4 -15.8L10.4 -13C15.8 -13 15.8 -7.4 10.2 -7.4Z";
    return `<g transform="${k.sideMatrix([x, y + dy], 0, P, "left")}"><path class="iso-fill dk-handle" d="${ring}"/><path class="iso-line" data-tone="mid" d="${ring}"/></g>`;
  };
  out.push(handle(-1.4));
  out.push(handle(1.4));
  // The mug tapers a little toward its foot; smooth knots shade it as one curved surface.
  out.push(S(G.solidOf([[1.4, 9.6, 1], [3, 10.1, 1], [16.4, 10.6, 1]], G.frameAlong([x, y, 0], [0, 0, 1]), P), { tone: "mid", flat: true, crease: "none" }));
  out.push(`<path class="dk-coffee" d="${k.onTop(k.circleRing(x, y, 9.4, 48), 16.4, P, true)}"/>`);
  out.push(L(k.ring(x, y, 9.4, 16.4, P, 48), { tone: "mid", flat: true, crease: "none" }));
  // Steam: the live code draws two rising wisps here, as short segments whose opacity fades in and out.
  out.push(`<g data-part="steam">${Array.from({ length: 2 * STEAM_SEGS }, () => `<path class="iso-line dk-steam" data-tone="lo" d=""/>`).join("")}</g>`);
  return `<g class="dk-flat">${out.join("")}</g>`;
}

// ---- Printer ----
function sheetSvg(index, z, [ox, oy] = [0, 0]) {
  // One printed CV lying on the tray: name bar, headline, a rule, then text lines.
  const sx = SHEET.x + ox;
  const sy = PILE_Y + oy;
  const plan = { x: sx, y: sy, w: SHEET.w, d: SHEET.d, r: 0.6 };
  const top = z + SHEET_T;
  const at2 = (u, v) => [sx + u, sy + v];
  const lines = [];
  lines.push(k.lineOnTop(at2(6, 8), at2(6 + 24 + (index % 3) * 4, 8), top, P));
  lines.push(k.lineOnTop(at2(6, 12), at2(6 + 18, 12), top, P));
  const body = [];
  for (const [v, w] of [[22, 46], [26, 38], [30, 42], [38, 46], [42, 30], [46, 40], [54, 44], [58, 34], [66, 40], [70, 26]]) body.push(k.lineOnTop(at2(6, v), at2(6 + w - (index * 3) % 8, v), top, P));
  return [
    S(k.slabOf(plan, z, SHEET_T, P, 2), { tone: "lo", crease: "none", className: "dk-sheet" }),
    `<path class="iso-line" data-tone="hi" d="${lines[0]}" style="stroke-width:1.6px"/>`,
    L(lines[1], { tone: "mid", free: true }),
    L(k.lineOnTop(at2(6, 17), at2(SHEET.w - 6, 17), top, P), { tone: "lo" }),
    L(body.join(""), { tone: "lo", free: true }),
  ].join("");
}

function printer() {
  const out = [`<path class="iso-halo" d="${k.haloOf(PR, 0, 8, P)}"/>`];
  for (const [x, y] of byDepth(k.corners(PR, 9))) out.push(S(k.cylinder(x, y, 3.2, 0, PR_PLINTH, P, 16), { tone: "lo" }));
  // Paper support at the back with a stack of blank sheets leaning on it.
  out.push(S(k.slabOf({ x: PR.x + 12, y: PR.y + 4, w: PR.w - 24, d: 3, r: 1 }, PR_TOP, 40, P, 3, 0.4), { tone: "lo" }));
  // Three blank sheets stand in the feed, each a little lower and nearer than the one behind it.
  for (let i = 0; i < 3; i++) out.push(S(k.slabOf({ x: PR.x + 18 + i * 0.8, y: PR.y + 7 + i * 1.2, w: SHEET.w - i * 1.6, d: 0.7, r: 0.2 }, PR_TOP, 36 - i * 2.2, P, 2), { tone: "lo", crease: "none", className: "dk-sheet" }));
  // Body.
  out.push(S(k.slabOf(PR, PR_PLINTH, PR_TOP - PR_PLINTH, P, 8, 1.6), { tone: "mid" }));
  // Lid seam, feed slot behind it, vents on the side.
  out.push(L(k.lineOnTop([PR.x, PR.y + 16], [PR_SIDE, PR.y + 16], PR_TOP, P) + k.segment([PR_SIDE, PR.y + 16, PR_TOP], [PR_SIDE, PR.y + 16, PR_PLINTH], P), { tone: "lo" }));
  out.push(L(k.planOutline({ x: PR.x + 14, y: PR.y + 10.4, w: PR.w - 28, d: 2.4, r: 1 }, PR_TOP, P, 3), { tone: "lo" }));
  out.push(L(rowOf(PR.y + 24, PR.y + 52, 3.2).map((y) => sideSlot(PR_SIDE, y, 9, PR_TOP - 8)).join(""), { tone: "faint" }));
  // Control panel on the top, front right: label plate, two buttons and the power light.
  const panel = { x: PR.x + 52, y: PR_FRONT - 18, w: 42, d: 13, r: 2 };
  out.push(S(k.slabOf(panel, PR_TOP, 0.8, P, 4), { tone: "lo", crease: "none" }));
  out.push(L([18, 12].map((w, i) => k.lineOnTop([panel.x + 4, panel.y + 4 + i * 3], [panel.x + 4 + w, panel.y + 4 + i * 3], PR_TOP + 0.8, P)).join(""), { tone: "lo", free: true }));
  for (const bx of [panel.x + 27, panel.x + 34]) out.push(S(k.cylinder(bx, panel.y + 6.5, 2.4, PR_TOP + 0.8, 1.4, P, 20, 0.3), { tone: "mid" }));
  out.push(`<g data-part="power">${S(k.cylinder(panel.x + 39.5, panel.y + 6.5, 1.2, PR_TOP + 0.8, 0.6, P, 16), { tone: "lo", className: "dk-led" })}</g>`);
  // Platen knob on the right side: a hub and a knurled grip, on the platen's axis behind the slot.
  const knobY = PR_FRONT - 22;
  const knobZ = PR_TOP - 12;
  const axis = G.frameAlong([PR_SIDE, knobY, knobZ], [1, 0, 0]);
  out.push(S(G.solidOf([[0, 3.6], [1.4, 3.6]], axis, P), { tone: "lo" }));
  out.push(S(G.solidOf([[1.4, 5.6, 1], [2, 6.2, 1], [6.4, 6.2, 1], [7.2, 5.4, 1]], axis, P), { tone: "mid" }));
  // Front face: a seam, the output slot and a label below it.
  out.push(`<g transform="${planeOf(PR_FRONT)}"><path class="iso-line" data-tone="faint" d="${flat(PR.x + 4, PR_PLINTH + 3, PR_SIDE - 4, PR_TOP - 3, 4)}"/></g>`);
  out.push(recess(PR_SLOT, PR_FRONT, `<path class="iso-line" data-tone="lo" d="M${PR_SLOT.x0} ${-(PR_SLOT.z0 + 2.2)}H${PR_SLOT.x1}"/>`, "dk-dark"));
  out.push(`<g transform="${planeOf(PR_FRONT)}">${L(Array.from({ length: 6 }, (_, i) => flat(PR.x + 14 + i * 3, 7, PR.x + 15.4 + i * 3, 11, 0.7, 4)).join(""), { tone: "lo" })}</g>`);
  return out.join("");
}

function tray() {
  const out = [S(k.slabOf(TRAY, 0, TRAY_Z, P, 4), { tone: "lo" })];
  out.push(S(k.slabOf({ x: TRAY.x, y: TRAY.y + TRAY.d - 3, w: TRAY.w, d: 3, r: 1 }, TRAY_Z, 3.4, P, 3), { tone: "mid" }));
  out.push(L(k.planOutline(k.insetPlan(TRAY, 2.2), TRAY_Z, P, 3), { tone: "faint" }));
  return out.join("");
}

function pile() {
  return Array.from({ length: PILE_MAX }, (_, i) => `<g data-pile="${i}" style="opacity:0">${sheetSvg(i, TRAY_Z + i * PILE_STEP, PILE_OFF[i])}</g>`).join("");
}

// The sheet coming out of the printer: drawn at the top of the pile, moved by the live code, and clipped to
// the space in front of the printer's face so it seems to come out of the slot.
function moving() {
  const id = "dk-out-clip";
  const corners = [];
  for (const x of [SHEET.x - 4, SHEET.x + SHEET.w + 4]) for (const y of [PR_FRONT, PR_FRONT + 140]) for (const z of [-2, SLOT_Z + 1.2]) corners.push(at([x, y, z]));
  const hull = hullOf(corners);
  return [
    `<clipPath id="${id}"><path d="${k.pathOf(hull, true)}"/></clipPath>`,
    `<g clip-path="url(#${id})"><g data-part="sheet" style="opacity:0">${sheetSvg(PILE_MAX, 0)}</g></g>`,
  ].join("");
}

function hullOf(points) {
  const pts = [...points].sort((a, b) => a[0] - b[0] || a[1] - b[1]);
  const cross = (o, a, b) => (a[0] - o[0]) * (b[1] - o[1]) - (a[1] - o[1]) * (b[0] - o[0]);
  const lower = [];
  for (const p of pts) {
    while (lower.length >= 2 && cross(lower[lower.length - 2], lower[lower.length - 1], p) <= 0) lower.pop();
    lower.push(p);
  }
  const upper = [];
  for (const p of pts.reverse()) {
    while (upper.length >= 2 && cross(upper[upper.length - 2], upper[upper.length - 1], p) <= 0) upper.pop();
    upper.push(p);
  }
  return lower.slice(0, -1).concat(upper.slice(0, -1));
}

// Painter's order: back to front. The printer stands right of the computer (nearer along x), so it comes after
// it; then the tray, the pile and the sheet coming out; then the cup, keyboard and mouse nearest the viewer.
const svg = k.figureSvg({
  width: WIDTH,
  height: HEIGHT,
  label:
    "An isometric drawing of a desk in the spirit of 1984: a computer whose screen shows a CV being typed, a keyboard, a mouse on its pad, a cup of coffee and a printer that prints each CV onto a growing pile.",
  body: [desk(), holder(), coffee(), computer(), printer(), tray(), pile(), moving(), keyboardCord(), keyboard(), mouse()],
});

const fine = (v) => Math.round(v * 1000) / 1000;
const vec = (by) => k.axisVector(P, by).map(fine);
const data = {
  keys: keyList,
  keyDown: vec([0, 0, -2.2]),
  sheetY: vec([0, 1, 0]),
  sheetZ: vec([0, 0, 1]),
  mouseX: vec([1, 0, 0]),
  mouseY: vec([0, 1, 0]),
  mouseDown: vec([0, 0, -0.5]),
  mouseCord: MOUSE_CORD.map((p) => at(p).map(fine)),
  mouseCordPull: [1, 0.75, 0.45, 0.2, 0, 0],
  steam: { base: at([CUP.x, CUP.y, 19]).map(fine), up: vec([0, 0, 1]), side: vec([1, -1, 0]).map((v) => fine(v / Math.SQRT2)), height: STEAM_H, segs: STEAM_SEGS },
  sheetX: vec([1, 0, 0]),
  sheet: { slotZ: SLOT_Z, fromY: PR_FRONT - SHEET.d - PILE_Y, pileStep: PILE_STEP, pileZ: TRAY_Z, max: PILE_MAX, off: PILE_OFF },
  screen: { cvX: CV_X, crtX0: CRT.x0, crtX1: CRT.x1, crtZ0: CRT.z0, crtZ1: CRT.z1, print: { x: BUTTONS[2].x1 - 4, z: BTN.z0 + 2 } },
};

const file = `// Generated by scripts/desk-hero/build.mjs. Do not edit by hand: change the build and run it again.
/* eslint-disable */
export const DESK_SVG = ${JSON.stringify(svg)};
export const DESK = ${JSON.stringify(data)} as const;
`;
writeFileSync(OUT, file);
// --page writes a standalone page of the still figure, for the skill's line-end check (scripts/lines.mjs).
const pageAt = process.argv.find((a) => a.startsWith("--page="));
if (pageAt) {
  const shown = svg.replace(/style="opacity:0"/g, "");
  writeFileSync(pageAt.slice(7), k.pageHtml({ title: "Desk", theme: "light", body: k.plateHtml({ fig: "Fig 1", title: "Desk", hint: "", body: `<div class="iso-stage">${shown}</div>` }) }));
}
console.log(`wrote ${OUT} (${(file.length / 1024).toFixed(0)} KB)`);
