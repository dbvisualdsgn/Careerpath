import { useEffect, useMemo, useRef, useState } from 'react';
import type { MouseEvent as ReactMouseEvent } from 'react';
import { useI18n } from '../../app/i18n';
import { DESK, DESK_SVG } from './deskFigure';
import './desk.css';

/** People from banknotes of eurozone countries before the euro, as short CVs. Printed one after another. */
const PEOPLE = [
  { name: 'Marie Curie', headline: 'Physicist & Chemist, Paris', roles: ['Professor, Sorbonne  1906-34', 'Polonium and radium  1898'], skills: 'Radioactivity, Chemistry' },
  { name: 'Carl F. Gauss', headline: 'Mathematician, Göttingen', roles: ['Director, Observatory  1807-55', 'Disquisitiones  1801'], skills: 'Number theory, Geodesy' },
  { name: 'Alessandro Volta', headline: 'Physicist, Pavia', roles: ['Professor, Pavia  1779-1819', 'The voltaic pile  1800'], skills: 'Electricity, Instruments' },
  { name: 'Adolphe Sax', headline: 'Instrument Maker, Paris', roles: ['Own workshop, Paris  1842', 'The saxophone  1846'], skills: 'Acoustics, Brass making' },
  { name: 'Gustave Eiffel', headline: 'Engineer, Paris', roles: ['Eiffel Tower, Paris  1887-89', 'Garabit Viaduct  1880-84'], skills: 'Iron structures, Bridges' },
] as const;

type Part = 'name' | 'headline' | 'label' | 'role1' | 'role2' | 'skills';
const FIELDS: Part[] = ['name', 'headline', 'label', 'role1', 'role2', 'skills'];
const textsOf = (i: number, label: string): Record<Part, string> => {
  const p = PEOPLE[i];
  return { name: p.name, headline: p.headline, label, role1: p.roles[0], role2: p.roles[1], skills: p.skills };
};

const ease = (t: number) => (t <= 0 ? 0 : t >= 1 ? 1 : t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2);
const clamp01 = (t: number) => Math.min(1, Math.max(0, t));
const move = (v: readonly number[], by: number) => `translate(${(v[0] * by).toFixed(2)} ${(v[1] * by).toFixed(2)})`;

/**
 * The homepage desk: the keyboard types a CV onto the screen, the mouse clicks Print, the printer's light comes
 * on and a sheet slides out onto the pile. Five CVs, then the pile is cleared and it starts again.
 * Each object answers a click: the computer moves to the next CV, the printer or the mouse prints now, the pile
 * clears, the keys press (and so do the real keys while the desk has focus); anywhere else pauses.
 */
type Hit = 'computer' | 'printer' | 'mouse' | 'pile' | 'keys';
type Actions = { hit: (what: Hit, key?: number) => void; type: (ch: string) => boolean };

export function DeskHero() {
  const { m } = useI18n();
  const h = m.homeX;
  const ref = useRef<HTMLDivElement>(null);
  const still = useMemo(() => typeof matchMedia !== 'undefined' && matchMedia('(prefers-reduced-motion: reduce)').matches, []);
  const [paused, setPaused] = useState(still);
  const pausedRef = useRef(paused);
  pausedRef.current = paused;
  const label = m.sections.experience.toUpperCase();
  const actions = useRef<Actions | null>(null);
  const [tip, setTip] = useState<{ hit: Hit; x: number; y: number } | null>(null);

  useEffect(() => {
    const root = ref.current;
    const svg = root?.querySelector('svg');
    if (!root || !svg) return;
    const q = <T extends Element = SVGElement>(sel: string) => svg.querySelector(sel) as T;
    const text = Object.fromEntries(FIELDS.map((f) => [f, q<SVGTextElement>(`[data-part="${f}"]`)])) as Record<Part, SVGTextElement>;
    const rule = q('[data-part="rule"]');
    const cursor = q<SVGRectElement>('[data-part="cursor"]');
    const buttons = q('[data-part="buttons"]');
    const printBtn = q('[data-btn="print"]');
    const pointer = q('[data-part="pointer"]');
    const mouse = q('[data-part="mouse"]');
    const mbutton = q('[data-part="mbutton"]');
    const mcord = q('[data-part="mcord"]');
    const power = q('[data-part="power"]');
    let printing = false;
    const sheet = q('[data-part="sheet"]');
    const pile = Array.from(svg.querySelectorAll<SVGElement>('[data-pile]'));
    const keyEls = DESK.keys.map((_, i) => q(`[data-key="${i}"]`));
    const keyAt = new Map<number, number>();

    const S = DESK.screen;
    const home = { x: 0, z: (S.crtZ0 + S.crtZ1) / 2 - 10 };
    const pressKey = (ch: string) => {
      const code = ch === ' ' ? ' ' : ch.toLowerCase();
      const i = (DESK.keys as readonly string[]).indexOf(code);
      if (i >= 0) keyAt.set(i, 0.09);
    };
    const placeCursor = (el: SVGTextElement) => {
      const len = el.textContent ? el.getComputedTextLength() : 0;
      const size = Number(el.getAttribute('font-size'));
      cursor.setAttribute('x', String(S.cvX + len + 0.6));
      cursor.setAttribute('y', String(Number(el.getAttribute('y')) - size * 0.82));
      cursor.setAttribute('height', String(size * 0.95));
    };
    const setPointer = (x: number, z: number) => pointer.setAttribute('transform', `translate(${x} ${-z})`);
    // The mouse travels with the pointer (about half its distance): right on screen is +x, up is away (−y).
    const setMouse = (x: number, z: number) => {
      const dx = (x - home.x) * 0.45;
      const dy = -(z - home.z) * 0.45;
      const sx = DESK.mouseX[0] * dx + DESK.mouseY[0] * dy;
      const sy = DESK.mouseX[1] * dx + DESK.mouseY[1] * dy;
      mouse.setAttribute('transform', `translate(${sx.toFixed(2)} ${sy.toFixed(2)})`);
      // The cord follows: fully at the mouse, not at all at the keyboard.
      mcord.setAttribute('d', 'M' + DESK.mouseCord.map(([px, py], i) => `${(px + sx * DESK.mouseCordPull[i]).toFixed(2)} ${(py + sy * DESK.mouseCordPull[i]).toFixed(2)}`).join('L'));
    };

    // One CV: type every field, show the buttons, point, click Print, print, settle.
    const TYPE = 0.045;
    let person = 0;
    let printed = 0;
    let started = false;
    let clock = 0;
    // Steps that last run every frame while live; instant steps (until === at) run exactly once.
    let timeline: { at: number; run: (t: number) => void; until: number; done?: boolean }[] = [];
    let total = 0;
    let printAt = 0;
    const reset = () => {
      for (const f of FIELDS) text[f].textContent = '';
      rule.style.opacity = '0';
      buttons.style.opacity = '0';
      pointer.style.opacity = '0';
      printBtn.removeAttribute('data-on');
      sheet.style.opacity = '0';
      cursor.style.display = '';
    };
    const plan = () => {
      reset();
      const texts = textsOf(person, label);
      timeline = [];
      // The hand brings the mouse back from Print while the screen clears (straight to rest the first time).
      const from = started ? S.print : home;
      timeline.push({ at: 0, until: 0.6, run: (p) => { const e = ease(p); setMouse(from.x + (home.x - from.x) * e, from.z + (home.z - from.z) * e); } });
      started = true;
      let t = 0.6;
      for (const f of FIELDS) {
        const value = texts[f];
        const start = t;
        const dur = value.length * TYPE;
        let shown = 0;
        timeline.push({
          at: start,
          until: start + dur,
          run: (p) => {
            const n = Math.round(p * value.length);
            while (shown < n) pressKey(value[shown++]);
            text[f].textContent = value.slice(0, n);
            if (f === 'headline' && p >= 1) rule.style.opacity = '1';
            placeCursor(text[f]);
          },
        });
        t += dur + (f === 'name' ? 0.35 : 0.18);
      }
      const ready = t + 0.2;
      timeline.push({ at: ready, until: ready, run: () => { cursor.style.display = 'none'; buttons.style.opacity = '1'; pointer.style.opacity = '1'; setPointer(home.x, home.z); } });
      const point = ready + 0.6;
      timeline.push({
        at: point,
        until: point + 1.1,
        run: (p) => {
          const e = ease(p);
          const x = home.x + (S.print.x - home.x) * e;
          const z = home.z + (S.print.z - home.z) * e;
          setPointer(x - 1, z + 1);
          setMouse(x, z);
        },
      });
      const click = point + 1.35;
      timeline.push({
        at: click,
        until: click + 0.16,
        run: (p) => {
          const down = p < 1 ? 1 : 0;
          mbutton.setAttribute('transform', move(DESK.mouseDown, down));
          printBtn.toggleAttribute('data-on', true);
          printing = true;
        },
      });
      // The sheet feeds out of the slot at a steady speed, then drops onto the pile.
      const feed = click + 0.5;
      const sh = DESK.sheet;
      timeline.push({
        at: feed,
        until: feed + 2.2,
        run: (p) => {
          sheet.style.opacity = '1';
          const fall = clamp01((p - 0.82) / 0.18);
          // Out of the slot at a steady feed, then a short fall that drifts onto this sheet's place in the pile.
          const [ox, oy] = sh.off[printed] ?? [0, 0];
          const y = sh.fromY * (1 - ease(clamp01(p / 0.82))) + oy * fall;
          const x = ox * fall;
          // The pile can be cleared mid-print, so the sheet aims for the pile's height as it is now.
          const landZ = sh.pileZ + printed * sh.pileStep;
          const z = sh.slotZ + (landZ - sh.slotZ) * fall * fall;
          const tx = DESK.sheetX[0] * x + DESK.sheetY[0] * y + DESK.sheetZ[0] * z;
          const ty = DESK.sheetX[1] * x + DESK.sheetY[1] * y + DESK.sheetZ[1] * z;
          sheet.setAttribute('transform', `translate(${tx.toFixed(2)} ${ty.toFixed(2)})`);
        },
      });
      const landed = feed + 2.25;
      timeline.push({
        at: landed,
        until: landed,
        run: () => {
          if (printed < pile.length) pile[printed].toggleAttribute('data-shown', true);
          sheet.style.opacity = '0';
          printed++;
        },
      });
      timeline.push({ at: landed + 0.7, until: landed + 0.7, run: () => { printing = false; printBtn.removeAttribute('data-on'); } });
      printAt = click;
      total = landed + (printed + 1 >= PEOPLE.length ? 3.2 : 1.6);
      clock = 0;
    };
    const clearPile = () => {
      printed = 0;
      pile.forEach((p) => p.removeAttribute('data-shown'));
    };
    const next = () => {
      person = (person + 1) % PEOPLE.length;
      if (person === 0 || printed >= pile.length) clearPile();
      plan();
    };

    const drawAt = (time: number) => {
      for (const step of timeline) {
        if (time < step.at || step.done) continue;
        const instant = step.until === step.at;
        step.run(instant ? 1 : clamp01((time - step.at) / (step.until - step.at)));
        // A finished step is drawn once at its end state, then left alone.
        if (instant || time >= step.until) step.done = true;
      }
    };

    if (still) {
      // Reduced motion: one finished CV on the screen and three printed copies on the pile.
      plan();
      drawAt(timeline[timeline.length - 3].at - 0.01);
      pointer.style.opacity = '0';
      printBtn.removeAttribute('data-on');
      [0, 1, 2].forEach((i) => pile[i].toggleAttribute('data-shown', true));
      printed = 3;
      return;
    }

    plan();
    // Clicks on the objects. A finished step left behind by a jump is drawn at its end, so skipping ahead
    // fills the screen at once.
    actions.current = {
      hit: (what, key) => {
        if (what === 'keys') {
          if (key !== undefined) keyAt.set(key, 0.12);
        } else if (what === 'pile') {
          if (!printing) clearPile();
        } else if (what === 'computer') {
          if (!printing) next();
        } else if (clock < printAt) {
          clock = printAt;
          drawAt(clock);
        }
        if (pausedRef.current && what !== 'keys') setPaused(false);
      },
      type: (ch) => {
        const i = (DESK.keys as readonly string[]).indexOf(ch.toLowerCase());
        if (i >= 0) keyAt.set(i, 0.12);
        return i >= 0;
      },
    };
    let frame = 0;
    let prev = 0;
    let visible = false;
    const tick = (now: number) => {
      const dt = prev ? Math.min((now - prev) / 1000, 1 / 20) : 1 / 60;
      prev = now;
      if (!pausedRef.current) {
        clock += dt;
        drawAt(clock);
        if (clock > total) next();
      }
      // The printer's light blinks yellow while it prints.
      power.toggleAttribute('data-on', printing && Math.floor(now / 220) % 2 === 0);
      for (const [i, held] of keyAt) {
        const left = held - dt;
        keyEls[i]?.setAttribute('transform', left > 0 ? move(DESK.keyDown, 1) : '');
        if (left > 0) keyAt.set(i, left);
        else keyAt.delete(i);
      }
      frame = visible ? requestAnimationFrame(tick) : 0;
    };
    const io = new IntersectionObserver(([entry]) => {
      visible = entry.isIntersecting;
      if (visible && !frame) {
        prev = 0;
        frame = requestAnimationFrame(tick);
      }
    });
    io.observe(root);
    return () => {
      io.disconnect();
      cancelAnimationFrame(frame);
      actions.current = null;
    };
  }, [still, label]);

  const toggle = () => !still && setPaused((p) => !p);
  const hitOf = (e: ReactMouseEvent) => {
    const el = (e.target as Element).closest('[data-hit]');
    return el ? { hit: el.getAttribute('data-hit') as Hit, key: (e.target as Element).closest('[data-key]')?.getAttribute('data-key') } : null;
  };
  const onClick = (e: ReactMouseEvent) => {
    const at = hitOf(e);
    if (!at || !actions.current) return toggle();
    actions.current.hit(at.hit, at.key == null ? undefined : Number(at.key));
  };
  const onMove = (e: ReactMouseEvent<HTMLDivElement>) => {
    const at = hitOf(e);
    if (!at || !actions.current) return setTip(null);
    const box = e.currentTarget.getBoundingClientRect();
    setTip({ hit: at.hit, x: e.clientX - box.left, y: e.clientY - box.top });
  };
  return (
    <div className="relative mx-auto mb-16 w-full max-w-3xl md:mb-0">
      {/* No player under the drawing: a click on the desk itself (or Enter/Space) pauses it and starts it again. */}
      <div
        ref={ref}
        className="desk-hero iso cursor-pointer focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[var(--focus)]"
        data-theme="light"
        role="button"
        tabIndex={0}
        aria-pressed={still ? undefined : paused}
        aria-label={`${h.deskLabel} ${still ? '' : paused ? h.heroPlay : h.heroPause}`.trim()}
        onClick={onClick}
        onMouseMove={onMove}
        onMouseLeave={() => setTip(null)}
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            toggle();
          } else if (e.key.length === 1 && !e.metaKey && !e.ctrlKey && !e.altKey) {
            actions.current?.type(e.key);
          }
        }}
        dangerouslySetInnerHTML={{ __html: DESK_SVG }}
      />
      {tip && (
        <span
          aria-hidden="true"
          className="pointer-events-none absolute z-10 -translate-x-1/2 whitespace-nowrap rounded-sm bg-[var(--ink)] px-2 py-1 font-mono text-[11px] leading-none text-[var(--paper)]"
          style={{ left: tip.x, top: tip.y - 30 }}
        >
          {h.deskHits[tip.hit]}
        </span>
      )}
    </div>
  );
}
