import { useEffect, useState } from 'react';
import { Accessibility, ArrowRight, Github, Languages, Link2, Lock, Pause, Play, Smartphone, X } from 'lucide-react';
import { SiteHeader } from '../app/components/SiteHeader';
import { Wordmark } from '../app/components/Wordmark';
import { useReveal } from '../app/hooks/useReveal';
import { useI18n } from '../app/i18n';
import { Documents } from './Documents';

const APP = '../app/';
const label = 'font-mono text-[11px] uppercase tracking-[0.14em] text-ink-soft';
const primaryBtn = 'nudge inline-flex h-12 items-center gap-3 rounded-sm bg-ink px-5 text-[15px] font-medium text-paper hover:opacity-90';
const textLink = 'inline-flex items-center gap-1.5 text-[15px] text-ink underline decoration-1 underline-offset-[6px] hover:decoration-2';
const body = 'max-w-[46ch] font-body text-lg leading-relaxed text-ink-soft';
const wrap = 'mx-auto max-w-6xl xl:max-w-none xl:px-12 px-4 sm:px-8';
const reducedMotion = () => Boolean(window.matchMedia?.('(prefers-reduced-motion: reduce)').matches);

/** The name as the brand writes it, inside a sentence. */
function Name() {
  return (
    <span className="whitespace-nowrap">
      curriculi <em>curricula</em>
    </span>
  );
}

/** "{name} …" with the brand set in place. */
function WithName({ text }: { text: string }) {
  const [before, after] = text.split('{name}');
  return (
    <>
      {before}
      <Name />
      {after}
    </>
  );
}

/** A numbered part of the page: number and title on the left, the text on the right. */
function Part({ id, n, title, children }: { id: string; n: number; title: string; children: React.ReactNode }) {
  const ref = useReveal<HTMLElement>(0.12);
  return (
    <section ref={ref} aria-labelledby={id} className="reveal border-t border-ink">
      <div className={`${wrap} grid gap-8 py-16 md:py-24 lg:grid-cols-[minmax(0,4fr)_minmax(0,8fr)] lg:gap-16`}>
        <div>
          <p className="font-title text-[72px] leading-none md:text-[112px]" aria-hidden="true">{n}.</p>
          <h2 id={id} className="mt-6 font-title text-3xl leading-[1.05] hyphens-auto [overflow-wrap:anywhere] md:text-5xl">{title}</h2>
        </div>
        <div className="min-w-0 lg:pt-4">{children}</div>
      </div>
    </section>
  );
}

/** Words drifting across the page, between the opening and the documents. Decorative: the same words are on the page. */
function Ticker() {
  const { m } = useI18n();
  const w = m.why;
  const words = [w.passport, w.licence, w.cv, w.once, w.forAll];
  const line = (
    <span className="flex shrink-0 items-center">
      {words.map((t) => (
        <span key={t} className="flex items-center">
          <span className="px-6 md:px-10">{t}</span>
          <span className="text-ink-soft">*</span>
        </span>
      ))}
    </span>
  );
  return (
    <div aria-hidden="true" className="overflow-hidden border-y border-ink py-4 font-title text-3xl leading-none md:text-5xl">
      <div className="ticker-track flex w-max whitespace-nowrap">
        {line}
        {line}
      </div>
    </div>
  );
}

export function Why() {
  const { m } = useI18n();
  const w = m.why;
  const h = m.home;
  const [paused, setPaused] = useState(false);
  const [still] = useState(reducedMotion);
  const heroRef = useReveal<HTMLDivElement>(0.1);

  useEffect(() => {
    document.title = `${w.nav} · ${m.app.name}`;
  }, [w.nav, m.app.name]);

  const does = [
    [w.does1t, w.does1],
    [w.does2t, w.does2],
    [w.does3t, w.does3],
    [w.does4t, w.does4],
  ];
  const forAll = [
    { icon: Languages, text: w.all1 },
    { icon: Smartphone, text: w.all2 },
    { icon: Accessibility, text: w.all3 },
    { icon: Github, text: w.all4 },
  ];

  return (
    <div className="min-h-screen bg-paper text-ink">
      <a href="#main" className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-3 focus:z-50 focus:rounded-sm focus:bg-ink focus:px-4 focus:py-2 focus:text-sm focus:text-paper">
        {m.app.skipToContent}
      </a>
      <SiteHeader root="../" current="why" />

      <main id="main" tabIndex={-1} data-paused={paused || undefined} className="focus:outline-none">
        {/* Opening */}
        <section className={`${wrap} pb-16 pt-14 md:pb-24 md:pt-24`}>
          <div ref={heroRef} className="reveal">
            <div className="flex items-start justify-between gap-6">
              <p className={label}>{w.kicker}</p>
              <span className="-mt-4 font-title text-[96px] leading-none md:-mt-8 md:text-[160px]" aria-hidden="true">*</span>
            </div>
            <h1 className="max-w-[16ch] font-title text-[clamp(2.25rem,8vw,3.75rem)] font-normal leading-[0.95] hyphens-auto [overflow-wrap:break-word] md:text-[clamp(3rem,6.5vw,7rem)] md:hyphens-manual">
              {w.title}
            </h1>
            <p className="mt-10 max-w-[30ch] font-body text-2xl leading-snug md:text-3xl">{w.lead}</p>
          </div>
        </section>

        <Ticker />

        {/* One person, three documents */}
        <section aria-labelledby="docs" className={`${wrap} py-16 md:py-24`}>
          <div className="flex flex-wrap items-end justify-between gap-x-10 gap-y-4">
            <div>
              <h2 id="docs" className="font-title text-3xl leading-[1.05] md:text-5xl">{w.docsTitle}</h2>
              <p className={`mt-4 ${body}`}>{w.docsLead}</p>
            </div>
            {!still && (
              <button
                type="button"
                onClick={() => setPaused((p) => !p)}
                className="inline-flex h-9 items-center gap-2 rounded-sm px-2 text-[14px] hover:bg-zinc-100"
              >
                {paused ? <Play size={20} aria-hidden="true" /> : <Pause size={20} aria-hidden="true" />}
                {paused ? w.play : w.pause}
              </button>
            )}
          </div>
          <Documents />
          <p className="mt-6 font-body text-[15px] text-ink-soft">{w.docsNote}</p>
        </section>

        <Part id="idea" n={1} title={w.ideaTitle}>
          <p className="max-w-[34ch] font-body text-2xl leading-snug md:text-3xl">{w.idea1}</p>
          <p className={`mt-6 ${body}`}>{w.idea2}</p>
          <p className="mt-10 font-title text-2xl leading-tight md:text-4xl">
            <span className="hl">
              <WithName text={w.idea3} />
            </span>
          </p>
        </Part>

        <Part id="origin" n={2} title={w.originTitle}>
          <p className={body}>{w.origin1}</p>
          <p className={`mt-4 ${body}`}>{w.origin2}</p>
          <blockquote className="mt-10 bg-ink p-6 text-paper md:p-10">
            <p className="font-title text-3xl leading-[1.05] md:text-5xl">{w.quote}</p>
            <footer className="mt-6 font-mono text-[11px] uppercase tracking-[0.14em]">Daniele Brusca</footer>
          </blockquote>
        </Part>

        <Part id="does" n={3} title={w.doesTitle}>
          <p className="max-w-[34ch] font-body text-2xl leading-snug md:text-3xl">{w.doesLead}</p>
          <ol className="mt-10 grid gap-px border border-ink bg-ink sm:grid-cols-2">
            {does.map(([t, d], i) => (
              <li key={t} className="bg-paper p-6">
                <span className="font-mono text-[11px] text-ink-soft" aria-hidden="true">{String(i + 1).padStart(2, '0')}</span>
                <h3 className="mt-6 font-title text-2xl">{t}</h3>
                <p className="mt-2 font-body text-[15px] leading-relaxed text-ink-soft">{d}</p>
              </li>
            ))}
          </ol>
          <p className="mt-10 font-title text-2xl leading-tight md:text-3xl">{w.doesEnd}</p>
        </Part>

        <Part id="not" n={4} title={w.notTitle}>
          <ul className="border-t border-ink">
            {[w.not1, w.not2, w.not3].map((t) => (
              <li key={t} className="flex items-center gap-4 border-b border-rule py-4 font-title text-2xl md:text-3xl">
                <X size={20} aria-hidden="true" className="shrink-0" />
                {t}
              </li>
            ))}
          </ul>
          <p className={`mt-8 ${body}`}>{w.notJob}</p>
        </Part>

        <Part id="data" n={5} title={w.dataTitle}>
          <ul className="grid gap-px border border-ink bg-ink md:grid-cols-2">
            {[
              { icon: Lock, text: w.data1 },
              { icon: Link2, text: w.data2 },
            ].map(({ icon: Icon, text }) => (
              <li key={text} className="bg-paper p-6 md:p-8">
                <Icon size={20} aria-hidden="true" />
                <p className="mt-6 font-body text-lg leading-snug">{text}</p>
              </li>
            ))}
          </ul>
        </Part>

        <Part id="all" n={6} title={w.allTitle}>
          <ul className="grid gap-px border border-ink bg-ink sm:grid-cols-2">
            {forAll.map(({ icon: Icon, text }) => (
              <li key={text} className="flex items-center gap-4 bg-paper p-6">
                <Icon size={20} aria-hidden="true" className="shrink-0" />
                <span className="font-title text-xl leading-tight">{text}</span>
              </li>
            ))}
          </ul>
          <p className="mt-10 max-w-[34ch] font-body text-2xl leading-snug md:text-3xl">{w.allEnd}</p>
        </Part>

        {/* Closing */}
        <section className="border-t border-ink">
          <div className={`${wrap} py-20 md:py-32`}>
            <p className="font-title text-[clamp(2.75rem,8vw,6.5rem)] leading-[0.95]">
              <span className="hl">{h.closing}</span>
            </p>
            <a href={`${APP}?new=1`} className={`${primaryBtn} mt-10`}>
              {h.closingCta}
              <ArrowRight size={20} aria-hidden="true" />
            </a>
          </div>
        </section>
      </main>

      <footer className="border-t border-ink">
        <div className={`${wrap} flex flex-col gap-6 py-10 sm:flex-row sm:items-center sm:justify-between`}>
          <Wordmark href="../" />
          <p className="font-body text-[15px] text-ink-soft">{h.footer}</p>
          <a href="https://github.com/dbvisualdsgn/Careerpath" className={textLink} rel="noopener noreferrer" target="_blank">
            <Github size={20} aria-hidden="true" />
            {h.source}
          </a>
        </div>
      </footer>
    </div>
  );
}
