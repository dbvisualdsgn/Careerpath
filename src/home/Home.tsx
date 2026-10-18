import { useEffect, useMemo } from 'react';
import { ArrowRight, ArrowUpRight, Check, ClipboardPaste, Github, Link2, ListChecks, Lock, Monitor, PenLine, Share2, Users } from 'lucide-react';
import { SiteHeader } from '../app/components/SiteHeader';
import { Wordmark } from '../app/components/Wordmark';
import { Portrait } from '../app/components/Portrait';
import { matchKeywords, runAtsCheck } from '../app/cv/atsCheck';
import { sampleCV } from '../app/cv/defaultCV';
import { people } from '../app/cv/people';
import { locales, useI18n } from '../app/i18n';
import { useCountUp, useReveal } from '../app/hooks/useReveal';

const APP = 'app/';
const label = 'font-mono text-[11px] uppercase tracking-[0.14em] text-ink-soft';
const primaryBtn = 'nudge inline-flex h-12 items-center gap-3 rounded-sm bg-ink px-5 text-[15px] font-medium text-paper hover:opacity-90';
const textLink = 'inline-flex items-center gap-1.5 text-[15px] text-ink underline decoration-1 underline-offset-[6px] hover:decoration-2';
const h2 = 'font-title text-3xl font-normal tracking-[-0.02em] md:text-5xl';

// A short job ad for the live keyword demo. The match below is computed by the real ATS check.
const DEMO_AD =
  'Senior Product Designer. You will own our design systems and accessibility, run user research, prototyping in Figma, ' +
  'and work closely with engineering on data-driven product decisions. Design systems experience is a must; accessibility is key.';

function Chapter({ id, title, n, children }: { id: string; title: string; n: number; children: React.ReactNode }) {
  const { m } = useI18n();
  const ref = useReveal<HTMLElement>(0.12);
  return (
    <section ref={ref} aria-labelledby={id} className="reveal border-t border-ink">
      <div className="mx-auto max-w-6xl px-4 py-16 sm:px-8 md:py-24">
        <div className="flex items-baseline justify-between gap-4">
          <h2 id={id} className={h2}>{title}</h2>
          <p className={label} aria-hidden="true">{m.home.chapter} {n}</p>
        </div>
        {children}
      </div>
    </section>
  );
}

/** A Kindle-like page showing what a finished CV looks like: just type. */
function PageSpecimen() {
  const { m } = useI18n();
  return (
    <figure aria-hidden="true" className="relative mx-auto w-full max-w-sm border border-ink bg-paper p-6 sm:p-8">
      <div className={`flex justify-between ${label}`}>
        <span>curriculi curricula</span>
        <span>1 / 1</span>
      </div>
      <div className="mt-10 font-body">
        <p className="font-title text-[34px] leading-[0.95] tracking-[-0.02em]">Ada<br />Lovelace</p>
        <p className="mt-3 text-[15px] text-ink-soft">Analyst &amp; Programmer · London<span className="caret ml-0.5 inline-block h-[1em] w-px translate-y-[2px] bg-ink" /></p>
      </div>
      <div className="mt-8 border-t border-ink pt-3">
        <p className={label}>{m.sections.experience}</p>
        <dl className="mt-3 space-y-3 font-body text-[14px]">
          <div className="flex justify-between gap-4 border-b border-rule pb-3">
            <dt className="font-title">Analytical Engine</dt>
            <dd className="font-mono text-[12px] text-ink-soft">1842 – 43</dd>
          </div>
          <div className="flex justify-between gap-4">
            <dt className="font-title">Notes on the Engine</dt>
            <dd className="font-mono text-[12px] text-ink-soft">1843</dd>
          </div>
        </dl>
      </div>
      <div className="mt-8 border-t border-ink pt-3">
        <p className={label}>{m.sections.skills}</p>
        <p className="mt-2 flex flex-wrap gap-1.5 font-body text-[13px]">
          <span className="rounded-full border border-ink bg-highlight px-2 py-0.5 italic text-[#111]">Mathematics</span>
          <span className="rounded-full border border-ink px-2 py-0.5">Algorithms</span>
          <span className="rounded-full border border-ink px-2 py-0.5">Writing</span>
        </p>
      </div>
      <div className="mt-10 flex items-center gap-3">
        <span className="h-px flex-1 bg-rule"><span className="block h-px w-full bg-ink" /></span>
        <span className="font-mono text-[11px] text-ink-soft">100%</span>
      </div>
    </figure>
  );
}

/** Three true facts about the tool, each a plain benefit. */
function Numbers() {
  const { m } = useI18n();
  const h = m.homeX;
  const ref = useReveal<HTMLElement>(0.2);
  const items: [string, string][] = [
    [h.n1v, h.n1],
    ['0', h.n2],
    [String(Object.keys(locales).length), h.n3],
  ];
  return (
    <section ref={ref} aria-label={h.numbersTitle} className="reveal border-t border-ink">
      <dl className="mx-auto grid max-w-6xl grid-cols-1 gap-px bg-rule sm:grid-cols-3">
        {items.map(([value, text], i) => (
          <div key={text} className="min-w-0 bg-paper px-4 py-10 sm:px-8">
            <dt className="sr-only">{text}</dt>
            <dd>
              <span className="block whitespace-nowrap font-title text-[clamp(2.5rem,7vw,5.5rem)] font-light leading-none tracking-[-0.04em]">
                {i === 0 ? <span className="hl">{value}</span> : value}
              </span>
              <span className="mt-3 block max-w-[18ch] font-mono text-[12px] uppercase tracking-[0.12em] text-ink-soft" aria-hidden="true">{text}</span>
            </dd>
          </div>
        ))}
      </dl>
    </section>
  );
}

/** The real ATS check, shown on the example CV: criteria, score meter, and the keyword match. */
function AtsInfographic() {
  const { m, locale } = useI18n();
  const h = m.homeX;
  const report = useMemo(() => runAtsCheck(sampleCV, locale), [locale]);
  const match = useMemo(() => matchKeywords(sampleCV, DEMO_AD, 'en'), []);
  const ref = useReveal<HTMLDivElement>(0.25);
  const shown = useCountUp(report.score, 1100);
  const checks = [h.c1, h.c2, h.c3, h.c4, h.c5, h.c6];
  const steps = 20;
  const filled = Math.round((report.score / 100) * steps);
  return (
    <div ref={ref} className="mt-12 grid gap-px border border-rule bg-rule lg:grid-cols-[minmax(0,5fr)_minmax(0,7fr)]">
      <div className="bg-paper p-6 md:p-10">
        <p className="max-w-[34ch] font-body text-lg leading-snug text-ink-soft">{h.atsLead}</p>
        <ol className="mt-8 border-t border-ink">
          {checks.map((c, i) => (
            <li key={c} className="flex items-baseline gap-4 border-b border-rule py-3 font-body text-lg">
              <span className="font-mono text-[11px] text-ink-soft" aria-hidden="true">{String(i + 1).padStart(2, '0')}</span>
              <span className="flex-1">{c}</span>
              <Check size={20} aria-hidden="true" className="text-go" />
            </li>
          ))}
        </ol>
      </div>
      <div className="flex flex-col gap-8 bg-paper p-6 md:p-10">
        <div>
          <p className={label}>{m.atsCard.title} · {sampleCV.profile.name}</p>
          <p className="mt-3 font-title leading-none">
            <span className="text-[88px] tracking-[-0.04em] tabular-nums" aria-hidden="true">{shown}</span>
            <span className="sr-only">{report.score}</span>
            <span className="font-mono text-[14px] text-ink-soft">/100</span>
          </p>
          <div className="mt-4 grid grid-cols-[repeat(20,minmax(0,1fr))] gap-[3px]" aria-hidden="true">
            {Array.from({ length: steps }, (_, i) => (
              <span key={i} className={`bar-grow h-2.5 ${i < filled ? 'bg-ink' : 'bg-rule'}`} style={{ transitionDelay: `${200 + i * 30}ms` }} />
            ))}
          </div>
        </div>
        <div className="grid gap-6 sm:grid-cols-[minmax(0,1fr)_minmax(0,1fr)]">
          <div>
            <p className={label}>{h.jobAd}</p>
            <p className="mt-3 font-body text-[15px] leading-relaxed text-ink-soft">“{DEMO_AD.slice(0, 160)}…”</p>
          </div>
          <div>
            <p className={label}>{h.yourCv} · {match.matched.length} {h.matched} · {match.missing.length} {h.missing}</p>
            <ul className="mt-3 flex flex-wrap gap-1.5">
              {match.matched.slice(0, 6).map((k) => (
                <li key={k} className="inline-flex items-center gap-1 rounded-full border border-ink bg-highlight px-2.5 py-1 font-body text-[13px] italic text-[#111]">
                  {k} <Check size={20} />
                </li>
              ))}
              {match.missing.slice(0, 5).map((k) => (
                <li key={k} className="rounded-full border border-dashed border-ink px-2.5 py-1 text-[13px]">{k} +</li>
              ))}
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}

/** How a share link works: the CV travels inside the link itself. */
function LinkDiagram() {
  const { m } = useI18n();
  const h = m.homeX;
  const nodes = [
    { icon: Monitor, text: h.linkA },
    { icon: Link2, text: h.linkB },
    { icon: Users, text: h.linkC },
  ];
  return (
    <figure className="mt-12">
      <div className="relative grid grid-cols-3 items-start" aria-hidden="true">
        {/* The line and the travelling dot */}
        <div className="absolute left-[16.66%] right-[16.66%] top-7 h-px bg-ink">
          <span className="link-dot absolute -top-[4px] left-0 h-[9px] w-[9px] rounded-full bg-signal" />
        </div>
        {nodes.map(({ icon: Icon, text }, i) => (
          <div key={text} className="relative flex flex-col items-center text-center">
            <span className={`flex h-14 w-14 items-center justify-center rounded-sm border border-ink ${i === 1 ? 'bg-highlight text-[#111]' : 'bg-paper'}`}>
              <Icon size={20} />
            </span>
            <span className="mt-4 font-title text-lg leading-tight md:text-xl">{text}</span>
            {i === 1 && <span className="mt-1 break-all font-mono text-[11px] text-ink-soft">…/app/#cv=eNqVk…</span>}
          </div>
        ))}
      </div>
      <figcaption className="mx-auto mt-10 max-w-[46ch] text-center font-body text-lg text-ink-soft">{h.linkNote}</figcaption>
    </figure>
  );
}

export function Home() {
  const { m } = useI18n();
  const h = m.home;
  const heroRef = useReveal<HTMLDivElement>(0.1);

  useEffect(() => {
    document.title = `${m.app.name} · ${h.kicker}`;
  }, [m.app.name, h.kicker]);

  const steps = [
    { icon: PenLine, title: h.s1t, body: h.s1 },
    { icon: ClipboardPaste, title: h.s2t, body: h.s2 },
    { icon: ListChecks, title: h.s3t, body: h.s3 },
    { icon: Share2, title: h.s4t, body: h.s4 },
  ];
  const faq = [
    [h.q1, h.a1],
    [h.q2, h.a2],
    [h.q3, h.a3],
  ];

  return (
    <div className="min-h-screen bg-paper text-ink">
      <a href="#main" className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-3 focus:z-50 focus:rounded-sm focus:bg-ink focus:px-4 focus:py-2 focus:text-sm focus:text-paper">
        {m.app.skipToContent}
      </a>
      <SiteHeader root="./" current="home" />

      <main id="main" tabIndex={-1} className="focus:outline-none">
        {/* Opening */}
        <section className="mx-auto grid max-w-6xl gap-14 px-4 pb-20 pt-14 sm:px-8 md:grid-cols-[minmax(0,7fr)_minmax(0,5fr)] md:items-end md:pb-28 md:pt-24">
          <div ref={heroRef} className="reveal">
            <p className={label}>{h.kicker}</p>
            <h1 className="mt-6 font-title text-[clamp(3rem,9vw,7.25rem)] font-normal leading-[0.92] tracking-[-0.035em]">
              {m.homeX.titleA} <span className="hl">{m.homeX.titleB}</span>
            </h1>
            <p className="mt-8 max-w-[34ch] font-body text-xl leading-snug text-ink-soft md:text-2xl">{h.sub}</p>
            <div className="mt-10 flex flex-wrap items-center gap-x-8 gap-y-4">
              <a href={`${APP}?new=1`} className={primaryBtn}>
                {h.start}
                <ArrowRight size={20} aria-hidden="true" />
              </a>
              <a href={`${APP}?example=1`} className={`nudge-up ${textLink}`}>
                {h.example}
                <ArrowUpRight size={20} aria-hidden="true" />
              </a>
            </div>
          </div>
          <PageSpecimen />
        </section>

        <Numbers />

        <Chapter id="how" title={h.howTitle} n={1}>
          <ol className="mt-12 grid gap-px border border-rule bg-rule sm:grid-cols-2 lg:grid-cols-4">
            {steps.map(({ icon: Icon, title, body }, i) => (
              <li key={title} className="flex flex-col bg-paper p-6 md:p-8">
                <div className="flex items-start justify-between">
                  <span className="font-title text-[72px] font-light leading-none tracking-[-0.04em]" aria-hidden="true">
                    {String(i + 1).padStart(2, '0')}
                  </span>
                  <Icon size={20} aria-hidden="true" className="mt-2 text-ink-soft" />
                </div>
                <h3 className="mt-10 font-title text-xl font-medium">{i === 1 ? <span className="hl">{title}</span> : title}</h3>
                <p className="mt-2 font-body text-[15px] leading-relaxed text-ink-soft">{body}</p>
              </li>
            ))}
          </ol>
        </Chapter>

        <Chapter id="ats" title={m.homeX.atsTitle} n={2}>
          <AtsInfographic />
        </Chapter>

        <Chapter id="privacy" title={h.privacyTitle} n={3}>
          <div className="mt-12 grid gap-px border border-rule bg-rule md:grid-cols-2">
            {[
              { icon: Lock, title: h.privateT, body: h.privateB },
              { icon: Link2, title: h.publicT, body: h.publicB },
            ].map(({ icon: Icon, title, body }) => (
              <div key={title} className="bg-paper p-6 md:p-10">
                <Icon size={20} aria-hidden="true" />
                <h3 className="mt-8 font-title text-4xl font-normal tracking-[-0.02em] md:text-6xl">{title}</h3>
                <p className="mt-4 max-w-[36ch] font-body text-lg leading-snug text-ink-soft">{body}</p>
              </div>
            ))}
          </div>
          <div className="mt-16">
            <h3 className={label}>{m.homeX.linkTitle}</h3>
            <LinkDiagram />
          </div>
        </Chapter>

        <Chapter id="people" title={m.homeX.peopleTitle} n={4}>
          <p className="mt-8 max-w-[52ch] font-body text-lg text-ink-soft">{m.directory.examples}</p>
          <ul className="mt-8 grid gap-px border border-rule bg-rule sm:grid-cols-2 lg:grid-cols-4">
            {people.slice(0, 4).map((p) => (
              <li key={p.id} className="bg-paper">
                <a href={`${APP}?person=${p.id}`} className="nudge-up flex h-full flex-col p-5 hover:bg-zinc-50 dark:hover:bg-zinc-900">
                  <Portrait name={p.cv.profile.name} className="h-14 w-14 text-xl" />
                  <span className="mt-6 font-title text-xl leading-tight">{p.cv.profile.name}</span>
                  <span className="mt-1 font-body text-[14px] text-ink-soft">{p.cv.profile.headline}</span>
                  <span className="mt-3 font-mono text-[11px] uppercase tracking-[0.12em] text-ink-soft">{m.fields[p.field]}</span>
                </a>
              </li>
            ))}
          </ul>
          <a href="people/" className={`nudge mt-8 ${textLink}`}>
            {m.homeX.peopleMore}
            <ArrowRight size={20} aria-hidden="true" />
          </a>
        </Chapter>

        <Chapter id="faq" title={h.faqTitle} n={5}>
          <dl className="mt-12 border-t border-ink">
            {faq.map(([q, a]) => (
              <div key={q} className="grid gap-1 border-b border-rule py-5 sm:grid-cols-2 sm:gap-6">
                <dt className="font-title text-xl">{q}</dt>
                <dd className="font-body text-lg text-ink-soft">{a}</dd>
              </div>
            ))}
          </dl>
        </Chapter>

        {/* Closing */}
        <section className="border-t border-ink">
          <div className="mx-auto max-w-6xl px-4 py-20 sm:px-8 md:py-32">
            <p className="font-title text-[clamp(2.75rem,8vw,6.5rem)] leading-[0.95] tracking-[-0.035em]">
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
        <div className="mx-auto flex max-w-6xl flex-col gap-6 px-4 py-10 sm:flex-row sm:items-center sm:justify-between sm:px-8">
          <Wordmark href="./" />
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
