import { useEffect, useState } from 'react';
import { Plus } from 'lucide-react';
import { useCountUp } from '../app/hooks/useReveal';
import { useI18n } from '../app/i18n';

const label = 'font-mono text-[11px] uppercase tracking-[0.14em] text-ink-soft';

// The lines that get "typed", in order. The specimen is a made-up CV for Ada Lovelace.
const SCRIPT = ['Ada Lovelace', 'Analyst & Programmer · London', 'Analytical Engine', 'Notes on the Engine'] as const;
const TOTAL = SCRIPT.reduce((n, s) => n + s.length, 0);
const CHAR_MS = 38;

const reducedMotion = () => Boolean(window.matchMedia?.('(prefers-reduced-motion: reduce)').matches);

/** Types the script once, then reports it is done. Under reduced motion everything is shown at once. */
function useTyping(delay = 700) {
  const [typed, setTyped] = useState(() => (reducedMotion() ? TOTAL : 0));
  useEffect(() => {
    if (typed >= TOTAL) return;
    const t = window.setTimeout(() => setTyped((n) => n + 1), typed === 0 ? delay : CHAR_MS);
    return () => window.clearTimeout(t);
  }, [typed, delay]);
  return typed;
}

/** One typed line: the full text holds the space (so nothing jumps), the typed part sits on top. */
function Typed({ index, typed, className = '' }: { index: number; typed: number; className?: string }) {
  const start = SCRIPT.slice(0, index).reduce((n, s) => n + s.length, 0);
  const text = SCRIPT[index];
  const shown = Math.max(0, Math.min(text.length, typed - start));
  const typing = shown > 0 && shown < text.length;
  const waiting = shown === 0 && typed === start;
  return (
    <span className={`grid ${className}`}>
      <span className="invisible [grid-area:1/1]">{text}</span>
      <span className="[grid-area:1/1]">
        {text.slice(0, shown)}
        {(typing || waiting) && <span className="caret ml-0.5 inline-block h-[1em] w-[2px] translate-y-[2px] bg-ink" />}
      </span>
    </span>
  );
}

/** A small finished CV page: it writes itself, then the recruiter check pops over it with a score and a tip. */
export function PageSpecimen() {
  const { m } = useI18n();
  const typed = useTyping();
  const done = typed >= TOTAL;
  const lineDone = (i: number) => typed >= SCRIPT.slice(0, i + 1).reduce((n, s) => n + s.length, 0);
  const [popped, setPopped] = useState(() => reducedMotion());
  useEffect(() => {
    if (!done || popped) return;
    const t = window.setTimeout(() => setPopped(true), 450);
    return () => window.clearTimeout(t);
  }, [done, popped]);
  const score = useCountUp(popped ? 92 : 0, 900);
  const fade = (on: boolean) => `transition-opacity duration-300 ${on ? 'opacity-100' : 'opacity-0'}`;

  return (
    <figure aria-hidden="true" className="relative mx-auto mb-16 w-full max-w-sm md:mb-0">
      <div className="border border-ink bg-paper p-6 sm:p-8">
        <div className={`flex justify-between ${label}`}>
          <span>curriculi curricula</span>
          <span>1 / 1</span>
        </div>
        <div className="mt-10 font-body">
          <Typed index={0} typed={typed} className="font-title text-[34px] leading-[0.95]" />
          <Typed index={1} typed={typed} className="mt-3 text-[15px] text-ink-soft" />
        </div>
        <div className="mt-8 border-t border-ink pt-3">
          <p className={label}>{m.sections.experience}</p>
          <dl className="mt-3 space-y-3 font-body text-[14px]">
            <div className="flex justify-between gap-4 border-b border-rule pb-3">
              <dt><Typed index={2} typed={typed} className="font-title" /></dt>
              <dd className={`font-mono text-[12px] text-ink-soft ${fade(lineDone(2))}`}>1842 – 43</dd>
            </div>
            <div className="flex justify-between gap-4">
              <dt><Typed index={3} typed={typed} className="font-title" /></dt>
              <dd className={`font-mono text-[12px] text-ink-soft ${fade(lineDone(3))}`}>1843</dd>
            </div>
          </dl>
        </div>
        <div className={`mt-8 border-t border-ink pt-3 ${fade(done)}`}>
          <p className={label}>{m.sections.skills}</p>
          <p className="mt-2 flex flex-wrap gap-1.5 font-body text-[13px]">
            <span className="rounded-full border border-ink bg-highlight px-2 py-0.5 italic text-[#111]">Mathematics</span>
            <span className="rounded-full border border-ink px-2 py-0.5">Algorithms</span>
            <span className="rounded-full border border-ink px-2 py-0.5">Writing</span>
          </p>
        </div>
        <div className="mt-10 flex items-center gap-3">
          <span className="h-px flex-1 bg-rule">
            <span className="block h-px bg-ink transition-[width] duration-100 ease-linear" style={{ width: `${Math.round((typed / TOTAL) * 100)}%` }} />
          </span>
          <span className="w-9 text-right font-mono text-[11px] tabular-nums text-ink-soft">{Math.round((typed / TOTAL) * 100)}%</span>
        </div>
      </div>

      {/* The recruiter check pops over the finished page: score, then one tip. */}
      <div
        className={`on-ink absolute -bottom-20 right-3 w-[17.5rem] p-4 sm:-right-8 md:-left-16 md:right-auto ${popped ? 'specimen-pop' : 'invisible opacity-0'}`}
      >
        <p className="flex items-center justify-between font-mono text-[10px] uppercase tracking-[0.14em] text-ink-soft">
          <span><span className="hl">{m.atsCard.title}</span></span>
        </p>
        <p className="mt-2 font-title leading-none">
          <span className="text-[44px] tabular-nums">{score}</span>
          <span className="font-mono text-[12px] text-ink-soft">/100</span>
        </p>
        <p className="specimen-tip mt-3 inline-flex items-start gap-1.5 rounded-full border border-ink px-3 py-1 text-[12px] leading-snug">
          {m.homeX.specimenTip}
          <Plus size={20} aria-hidden="true" className="-my-0.5 shrink-0" />
        </p>
      </div>
    </figure>
  );
}
