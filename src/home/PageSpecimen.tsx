import { useEffect, useMemo, useState } from 'react';
import { ChevronLeft, ChevronRight, Pause, Play, Plus } from 'lucide-react';
import { useCountUp } from '../app/hooks/useReveal';
import { loadPreview, previewFamily } from '../app/titleFontLoader';
import { useI18n } from '../app/i18n';
import { paperColors } from '../app/paper';

/** A CV for someone who appeared on a banknote of a eurozone country before the euro. Short and factual. */
interface Specimen {
  name: string;
  headline: string;
  /** The banknote, for reference only (not shown). */
  note: string;
  roles: [string, string][];
  skills: string[];
  /** Title font (a slug from titleFonts.ts), chosen to suit the person. */
  font: string;
  colors: { paper: string; ink: string; soft: string; accent: string };
  score: number;
}

// Only the site's own colours: a paper from the light scale (cool to warm), near-black ink,
// secondary text from the same scale (7:1 or more), and the highlight yellow for the first skill.
const INK = '#111111';
const HIGHLIGHT = '#e6f05a';
function tone(warmth: number): Specimen['colors'] {
  const { vars } = paperColors({ warmth, brightness: 100 });
  return { paper: vars['--paper'], ink: INK, soft: vars['--ink-soft'], accent: HIGHLIGHT };
}
// One card sits on the highlight itself; its first skill takes the paper instead.
const YELLOW: Specimen['colors'] = { paper: HIGHLIGHT, ink: INK, soft: '#45433f', accent: '#eceae5' };

const SPECIMENS: Specimen[] = [
  {
    name: 'Marie Curie',
    headline: 'Physicist & Chemist · Paris',
    note: '500 francs · France',
    roles: [['Professor of Physics, Sorbonne', '1906 – 34'], ['Discovered polonium and radium', '1898']],
    skills: ['Radioactivity', 'Chemistry', 'Teaching'],
    font: 'zodiak',
    colors: tone(0),
    score: 94,
  },
  {
    name: 'Carl Friedrich Gauss',
    headline: 'Mathematician & Astronomer · Göttingen',
    note: '10 Deutsche Mark · Germany',
    roles: [['Director, Göttingen Observatory', '1807 – 55'], ['Disquisitiones Arithmeticae', '1801']],
    skills: ['Number theory', 'Astronomy', 'Geodesy'],
    font: 'jet-brains-mono',
    colors: tone(40),
    score: 91,
  },
  {
    name: 'Alessandro Volta',
    headline: 'Physicist · Pavia',
    note: '10 000 lire · Italy',
    roles: [['Professor of Experimental Physics, Pavia', '1779 – 1819'], ['Invented the voltaic pile, the first battery', '1800']],
    skills: ['Electricity', 'Chemistry', 'Instruments'],
    font: 'bespoke-serif',
    colors: tone(100),
    score: 89,
  },
  {
    name: 'Adolphe Sax',
    headline: 'Instrument Maker · Paris',
    note: '200 francs · Belgium',
    roles: [['Founder, instrument workshop, Paris', '1842'], ['Patented the saxophone', '1846']],
    skills: ['Acoustics', 'Brass making', 'Teaching'],
    font: 'melodrama',
    colors: YELLOW,
    score: 87,
  },
  {
    name: 'Gustave Eiffel',
    headline: 'Engineer · Paris',
    note: '200 francs · France',
    roles: [['Eiffel Tower, Paris', '1887 – 89'], ['Garabit Viaduct', '1880 – 84']],
    skills: ['Iron structures', 'Bridges', 'Aerodynamics'],
    font: 'bespoke-stencil',
    colors: tone(70),
    score: 93,
  },
];

const CHAR_MS = 34;
const HOLD_MS = 3200;
const reducedMotion = () => Boolean(window.matchMedia?.('(prefers-reduced-motion: reduce)').matches);
const linesOf = (s: Specimen) => [s.name, s.headline, s.roles[0][0], s.roles[1][0]];

/** One typed line: the full text holds the space (so nothing jumps), the typed part sits on top. */
function Typed({ text, shown, caret, className = '', style }: { text: string; shown: number; caret: boolean; className?: string; style?: React.CSSProperties }) {
  return (
    <span className={`grid ${className}`} style={style}>
      <span className="invisible [grid-area:1/1]">{text}</span>
      <span className="[grid-area:1/1]">
        {text.slice(0, shown)}
        {caret && <span className="caret ml-0.5 inline-block h-[1em] w-[2px] translate-y-[2px]" style={{ background: 'currentColor' }} />}
      </span>
    </span>
  );
}

/** Five CVs, one at a time: each writes itself in its own typeface and paper, then the recruiter check pops over it. */
export function PageSpecimen() {
  const { m } = useI18n();
  const h = m.homeX;
  const still = useMemo(reducedMotion, []);
  const [index, setIndex] = useState(0);
  const [typed, setTyped] = useState(0);
  const [paused, setPaused] = useState(still);
  const [ready, setReady] = useState(false);
  const s = SPECIMENS[index];
  const lines = linesOf(s);
  const total = lines.reduce((n, l) => n + l.length, 0);
  const done = still || typed >= total;
  const [popped, setPopped] = useState(still);

  // Each CV loads its own font first, then types; the next one's font loads in the background.
  useEffect(() => {
    setReady(false);
    setTyped(still ? total : 0);
    setPopped(still);
    loadPreview(s.font).finally(() => setReady(true));
    loadPreview(SPECIMENS[(index + 1) % SPECIMENS.length].font);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [index]);

  useEffect(() => {
    if (!ready || still || typed >= total) return;
    const t = window.setTimeout(() => setTyped((n) => n + 1), typed === 0 ? 500 : CHAR_MS);
    return () => window.clearTimeout(t);
  }, [ready, typed, total, still]);

  useEffect(() => {
    if (!done || popped) return;
    const t = window.setTimeout(() => setPopped(true), 400);
    return () => window.clearTimeout(t);
  }, [done, popped]);

  // After the check has popped, hold, then move to the next person (unless paused).
  useEffect(() => {
    if (!popped || paused) return;
    const t = window.setTimeout(() => setIndex((i) => (i + 1) % SPECIMENS.length), HOLD_MS);
    return () => window.clearTimeout(t);
  }, [popped, paused]);

  const go = (step: number) => setIndex((i) => (i + step + SPECIMENS.length) % SPECIMENS.length);
  const score = useCountUp(popped ? s.score : 0, 800);
  const shownOf = (i: number) => {
    const start = lines.slice(0, i).reduce((n, l) => n + l.length, 0);
    return done ? lines[i].length : Math.max(0, Math.min(lines[i].length, typed - start));
  };
  const caretAt = (i: number) => {
    if (done) return false;
    const start = lines.slice(0, i).reduce((n, l) => n + l.length, 0);
    return typed >= start && typed < start + lines[i].length;
  };
  const lineDone = (i: number) => shownOf(i) >= lines[i].length;
  const fade = (on: boolean) => `transition-opacity duration-300 ${on ? 'opacity-100' : 'opacity-0'}`;
  const titleFont = { fontFamily: `'${previewFamily(s.font)}', var(--font-sans)`, fontWeight: 700 };
  const label = 'font-mono text-[11px] uppercase tracking-[0.14em]';
  const progress = Math.round(((done ? total : typed) / total) * 100);

  return (
    <div className="relative mx-auto mb-16 w-full max-w-sm md:mb-0">
      <figure aria-hidden="true" className="relative">
        <div key={index} className="diagram-in flex min-h-[29rem] flex-col border p-6 sm:p-8" style={{ background: s.colors.paper, color: s.colors.ink, borderColor: s.colors.ink }}>
          <div>
            <Typed text={s.name} shown={shownOf(0)} caret={caretAt(0)} className="text-[30px] leading-[1.02]" style={titleFont} />
            <Typed text={s.headline} shown={shownOf(1)} caret={caretAt(1)} className="mt-3 font-body text-[15px]" style={{ color: s.colors.soft }} />
          </div>
          <div className="mt-8 border-t pt-3" style={{ borderColor: s.colors.ink }}>
            <p className={label} style={{ color: s.colors.soft }}>{m.sections.experience}</p>
            <dl className="mt-3 space-y-3 text-[14px]">
              {s.roles.map(([title, dates], i) => (
                <div key={title} className="flex justify-between gap-4 border-b pb-3 last:border-b-0 last:pb-0" style={{ borderColor: `${s.colors.ink}33` }}>
                  <dt><Typed text={title} shown={shownOf(2 + i)} caret={caretAt(2 + i)} style={titleFont} /></dt>
                  <dd className={`shrink-0 font-mono text-[12px] ${fade(lineDone(2 + i))}`} style={{ color: s.colors.soft }}>{dates}</dd>
                </div>
              ))}
            </dl>
          </div>
          <div className={`mt-8 border-t pt-3 ${fade(done)}`} style={{ borderColor: s.colors.ink }}>
            <p className={label} style={{ color: s.colors.soft }}>{m.sections.skills}</p>
            <p className="mt-2 flex flex-wrap gap-1.5 font-body text-[13px]">
              {s.skills.map((k, i) => (
                <span key={k} className={`rounded-full border px-2 py-0.5 ${i === 0 ? 'italic' : ''}`} style={{ borderColor: s.colors.ink, background: i === 0 ? s.colors.accent : 'transparent' }}>
                  {k}
                </span>
              ))}
            </p>
          </div>
          <div className="mt-auto flex items-center gap-3 pt-10">
            <span className="h-px flex-1" style={{ background: `${s.colors.ink}33` }}>
              <span className="block h-px transition-[width] duration-100 ease-linear" style={{ width: `${progress}%`, background: s.colors.ink }} />
            </span>
            <span className="w-9 text-right font-mono text-[11px] tabular-nums" style={{ color: s.colors.soft }}>{progress}%</span>
          </div>
        </div>

        {/* The recruiter check pops over the finished page: score, then one tip. */}
        <div className={`on-ink absolute -bottom-16 right-3 w-[17.5rem] p-4 sm:-right-8 md:-left-16 md:right-auto ${popped ? 'specimen-pop' : 'invisible opacity-0'}`}>
          <p className="font-mono text-[10px] uppercase tracking-[0.14em] text-ink-soft"><span className="hl">{m.atsCard.title}</span></p>
          <p className="mt-2 font-title leading-none">
            <span className="text-[44px] tabular-nums">{score}</span>
            <span className="font-mono text-[12px] text-ink-soft">/100</span>
          </p>
          <p className="specimen-tip mt-3 inline-flex items-start gap-1.5 rounded-full border border-ink px-3 py-1 text-[12px] leading-snug">
            {h.specimenTip}
            <Plus size={20} aria-hidden="true" className="-my-0.5 shrink-0" />
          </p>
        </div>
      </figure>

      {/* Moving content needs a way to stop it (WCAG 2.2.2): pause, and step through by hand. */}
      <div className="mt-24 flex items-center gap-1 md:mt-24">
        <button type="button" onClick={() => go(-1)} aria-label={h.heroPrev} className="inline-flex h-9 w-9 items-center justify-center rounded-sm hover:bg-zinc-100">
          <ChevronLeft size={20} aria-hidden="true" />
        </button>
        <button type="button" onClick={() => setPaused((p) => !p)} aria-pressed={paused} aria-label={paused ? h.heroPlay : h.heroPause} className="inline-flex h-9 w-9 items-center justify-center rounded-sm hover:bg-zinc-100">
          {paused ? <Play size={20} aria-hidden="true" /> : <Pause size={20} aria-hidden="true" />}
        </button>
        <button type="button" onClick={() => go(1)} aria-label={h.heroNext} className="inline-flex h-9 w-9 items-center justify-center rounded-sm hover:bg-zinc-100">
          <ChevronRight size={20} aria-hidden="true" />
        </button>
        <p className="ml-2 font-mono text-[11px] uppercase tracking-[0.12em] text-ink-soft">
          {h.heroCaption}
          <span className="sr-only">: {s.name}</span>
        </p>
      </div>
    </div>
  );
}
