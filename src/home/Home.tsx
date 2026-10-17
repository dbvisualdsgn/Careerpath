import { useEffect } from 'react';
import { ArrowRight, ArrowUpRight, Download, Github, Link2, Lock, PenLine, ListChecks, Share2 } from 'lucide-react';
import { Wordmark } from '../app/components/Wordmark';
import { TypeSwitcher } from '../app/components/TypeSwitcher';
import { LanguageSwitcher } from '../app/components/LanguageSwitcher';
import { ThemeToggle } from '../app/components/ThemeToggle';
import { useI18n } from '../app/i18n';

const APP = 'app/';
const label = 'whitespace-nowrap font-mono text-[11px] uppercase tracking-[0.14em] text-ink-soft';
const primaryBtn =
  'inline-flex h-12 items-center gap-3 rounded-sm bg-ink px-5 text-[15px] font-medium text-paper hover:opacity-90';
const textLink = 'inline-flex items-center gap-1.5 text-[15px] text-ink underline decoration-1 underline-offset-[6px] hover:decoration-2';

/** A Kindle-like page showing what a finished CV looks like: just type. */
function PageSpecimen() {
  const { m } = useI18n();
  return (
    <figure aria-hidden="true" className="relative mx-auto w-full max-w-sm border border-ink bg-paper p-6 sm:p-8">
      <div className={`flex justify-between ${label}`}>
        <span>curriculi curricula</span>
        <span>1 / 1</span>
      </div>
      <div className="mt-10 font-reading">
        <p className="text-[34px] leading-[0.95] tracking-[-0.02em]">Ada<br />Lovelace</p>
        <p className="mt-3 text-[15px] text-ink-soft">Analyst &amp; Programmer · London</p>
      </div>
      <div className="mt-8 border-t border-ink pt-3">
        <p className={label}>{m.sections.experience}</p>
        <dl className="mt-3 space-y-3 font-reading text-[14px]">
          <div className="flex justify-between gap-4 border-b border-rule pb-3">
            <dt>Analytical Engine</dt>
            <dd className="font-mono text-[12px] text-ink-soft">1842 – 43</dd>
          </div>
          <div className="flex justify-between gap-4">
            <dt>Notes on the Engine</dt>
            <dd className="font-mono text-[12px] text-ink-soft">1843</dd>
          </div>
        </dl>
      </div>
      <div className="mt-8 border-t border-ink pt-3">
        <p className={label}>{m.sections.skills}</p>
        <p className="mt-2 font-reading text-[14px] leading-relaxed">Mathematics, Algorithms, Writing</p>
      </div>
      <div className="mt-10 flex items-center gap-3">
        <span className="h-px flex-1 bg-rule"><span className="block h-px w-full bg-ink" /></span>
        <span className="font-mono text-[11px] text-ink-soft">100%</span>
      </div>
    </figure>
  );
}

export function Home() {
  const { m } = useI18n();
  const h = m.home;

  useEffect(() => {
    document.title = `${m.app.name} · ${h.kicker}`;
  }, [m.app.name, h.kicker]);

  const steps = [
    { icon: PenLine, title: h.s1t, body: h.s1 },
    { icon: ListChecks, title: h.s2t, body: h.s2 },
    { icon: Share2, title: h.s3t, body: h.s3 },
    { icon: Download, title: h.s4t, body: h.s4 },
  ];
  const faq = [
    [h.q1, h.a1],
    [h.q2, h.a2],
    [h.q3, h.a3],
  ];

  return (
    <div className="min-h-screen bg-paper text-ink">
      <a
        href="#main"
        className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-3 focus:z-50 focus:rounded-sm focus:bg-ink focus:px-4 focus:py-2 focus:text-sm focus:text-paper"
      >
        {m.app.skipToContent}
      </a>

      <header className="sticky top-0 z-40 border-b border-rule bg-paper">
        <nav aria-label={m.app.home} className="mx-auto flex h-16 max-w-6xl items-center justify-between gap-2 px-4 sm:px-8">
          <Wordmark href="./" compact />
          <div className="flex items-center gap-1">
            <TypeSwitcher />
            <LanguageSwitcher />
            <ThemeToggle />
            <a href={APP} className="ml-1 hidden h-9 items-center gap-2 rounded-sm border border-ink px-3 text-sm sm:inline-flex hover:bg-ink hover:text-paper">
              {h.openCV}
            </a>
          </div>
        </nav>
      </header>

      <main id="main" tabIndex={-1} className="focus:outline-none">
        {/* Opening */}
        <section className="mx-auto grid max-w-6xl gap-14 px-4 pb-20 pt-14 sm:px-8 md:grid-cols-[minmax(0,7fr)_minmax(0,5fr)] md:items-end md:pb-28 md:pt-24">
          <div>
            <p className={label}>{h.kicker}</p>
            <h1 className="mt-6 font-reading text-[clamp(3rem,9vw,7.25rem)] font-normal leading-[0.92] tracking-[-0.035em]">
              {h.title}
            </h1>
            <p className="mt-8 max-w-[34ch] font-reading text-xl leading-snug text-ink-soft md:text-2xl">{h.sub}</p>
            <div className="mt-10 flex flex-wrap items-center gap-x-8 gap-y-4">
              <a href={`${APP}?new=1`} className={primaryBtn}>
                {h.start}
                <ArrowRight size={18} aria-hidden="true" />
              </a>
              <a href={`${APP}?example=1`} className={textLink}>
                {h.example}
                <ArrowUpRight size={16} aria-hidden="true" />
              </a>
            </div>
          </div>
          <PageSpecimen />
        </section>

        {/* How it works */}
        <section aria-labelledby="how" className="border-t border-ink">
          <div className="mx-auto max-w-6xl px-4 py-16 sm:px-8 md:py-24">
            <div className="flex items-baseline justify-between gap-4">
              <h2 id="how" className="font-reading text-3xl font-normal tracking-[-0.02em] md:text-5xl">{h.howTitle}</h2>
              <p className={label} aria-hidden="true">{h.chapter} 1</p>
            </div>
            <ol className="mt-12 grid gap-px border border-rule bg-rule sm:grid-cols-2 lg:grid-cols-4">
              {steps.map(({ icon: Icon, title, body }, i) => (
                <li key={title} className="flex flex-col bg-paper p-6 md:p-8">
                  <div className="flex items-start justify-between">
                    <span className="font-reading text-[72px] font-light leading-none tracking-[-0.04em]" aria-hidden="true">
                      {String(i + 1).padStart(2, '0')}
                    </span>
                    <Icon size={20} strokeWidth={1.5} aria-hidden="true" className="mt-2 text-ink-soft" />
                  </div>
                  <h3 className="mt-10 font-reading text-xl font-medium">{title}</h3>
                  <p className="mt-2 font-reading text-[15px] leading-relaxed text-ink-soft">{body}</p>
                </li>
              ))}
            </ol>
          </div>
        </section>

        {/* Private or public */}
        <section aria-labelledby="privacy" className="border-t border-ink">
          <div className="mx-auto max-w-6xl px-4 py-16 sm:px-8 md:py-24">
            <div className="flex items-baseline justify-between gap-4">
              <h2 id="privacy" className="font-reading text-3xl font-normal tracking-[-0.02em] md:text-5xl">{h.privacyTitle}</h2>
              <p className={label} aria-hidden="true">{h.chapter} 2</p>
            </div>
            <div className="mt-12 grid gap-px border border-rule bg-rule md:grid-cols-2">
              {[
                { icon: Lock, title: h.privateT, body: h.privateB },
                { icon: Link2, title: h.publicT, body: h.publicB },
              ].map(({ icon: Icon, title, body }) => (
                <div key={title} className="bg-paper p-6 md:p-10">
                  <Icon size={22} strokeWidth={1.5} aria-hidden="true" />
                  <h3 className="mt-8 font-reading text-4xl font-normal tracking-[-0.02em] md:text-6xl">{title}</h3>
                  <p className="mt-4 max-w-[36ch] font-reading text-lg leading-snug text-ink-soft">{body}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Quick answers */}
        <section aria-labelledby="faq" className="border-t border-ink">
          <div className="mx-auto grid max-w-6xl gap-10 px-4 py-16 sm:px-8 md:grid-cols-[minmax(0,5fr)_minmax(0,7fr)] md:py-24">
            <div className="flex items-baseline justify-between gap-4 md:block">
              <h2 id="faq" className="font-reading text-3xl font-normal tracking-[-0.02em] md:text-5xl">{h.faqTitle}</h2>
              <p className={`${label} md:mt-4`} aria-hidden="true">{h.chapter} 3</p>
            </div>
            <dl className="border-t border-ink">
              {faq.map(([q, a]) => (
                <div key={q} className="grid gap-1 border-b border-rule py-5 sm:grid-cols-2 sm:gap-6">
                  <dt className="font-reading text-xl">{q}</dt>
                  <dd className="font-reading text-lg text-ink-soft">{a}</dd>
                </div>
              ))}
            </dl>
          </div>
        </section>

        {/* Closing */}
        <section className="border-t border-ink">
          <div className="mx-auto max-w-6xl px-4 py-20 sm:px-8 md:py-32">
            <p className="font-reading text-[clamp(2.75rem,8vw,6.5rem)] leading-[0.95] tracking-[-0.035em]">{h.closing}</p>
            <a href={`${APP}?new=1`} className={`${primaryBtn} mt-10`}>
              {h.closingCta}
              <ArrowRight size={18} aria-hidden="true" />
            </a>
          </div>
        </section>
      </main>

      <footer className="border-t border-ink">
        <div className="mx-auto flex max-w-6xl flex-col gap-6 px-4 py-10 sm:flex-row sm:items-center sm:justify-between sm:px-8">
          <Wordmark href="./" />
          <p className="font-reading text-[15px] text-ink-soft">{h.footer}</p>
          <a href="https://github.com/dbvisualdsgn/Careerpath" className={textLink} rel="noopener noreferrer" target="_blank">
            <Github size={16} aria-hidden="true" />
            {h.source}
          </a>
        </div>
      </footer>
    </div>
  );
}
