import { useEffect, useMemo, useState } from 'react';
import { ArrowUpRight, Info, Plus, Search, X } from 'lucide-react';
import { SiteHeader } from '../app/components/SiteHeader';
import { CVCard } from '../app/components/CVCard';
import { Wordmark } from '../app/components/Wordmark';
import { fields, people, type Field } from '../app/cv/people';
import { useReveal } from '../app/hooks/useReveal';
import { PublicCVs } from './PublicCVs';
import { fmt, useI18n } from '../app/i18n';

const label = 'whitespace-nowrap font-mono text-[11px] uppercase tracking-[0.14em] text-ink-soft';

export function People() {
  const { m } = useI18n();
  const d = m.directory;
  const [query, setQuery] = useState('');
  const [active, setActive] = useState<Field | null>(null);
  const titleRef = useReveal<HTMLDivElement>(0.3);

  useEffect(() => {
    document.title = `${d.title} · ${m.app.name}`;
  }, [d.title, m.app.name]);

  const list = useMemo(() => {
    const q = query.trim().toLowerCase();
    return people.filter((p) => {
      if (active && p.field !== active) return false;
      if (!q) return true;
      const hay = [p.cv.profile.name, p.cv.profile.headline, p.cv.profile.location, ...p.cv.skills].join(' ').toLowerCase();
      return hay.includes(q);
    });
  }, [query, active]);

  const usedFields = fields.filter((f) => people.some((p) => p.field === f));

  return (
    <div className="min-h-screen bg-paper text-ink">
      <a href="#main" className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-3 focus:z-50 focus:rounded-sm focus:bg-ink focus:px-4 focus:py-2 focus:text-sm focus:text-paper">
        {m.app.skipToContent}
      </a>
      <SiteHeader root="../" current="people" />

      <main id="main" tabIndex={-1} className="mx-auto max-w-6xl xl:max-w-none xl:px-12 px-4 pb-24 pt-14 focus:outline-none sm:px-8 md:pt-20">
        <div ref={titleRef} className="reveal flex flex-wrap items-end justify-between gap-6">
          <div>
            <p className={label}>{fmt(d.count, { count: people.length })}</p>
            <h1 className="mt-4 font-title text-[clamp(2.25rem,8vw,6rem)] hyphens-auto [overflow-wrap:anywhere] font-normal leading-[0.92] tracking-[-0.035em]">
              <span className="hl">{d.title}</span>
            </h1>
            <p className="mt-6 max-w-[40ch] font-body text-xl text-ink-soft">{d.intro}</p>
          </div>
          <a href="../app/?new=1" className="nudge inline-flex h-12 items-center gap-3 rounded-sm bg-ink px-5 text-[15px] font-medium text-paper hover:opacity-90">
            {m.home.start}
            <Plus size={20} aria-hidden="true" />
          </a>
        </div>

        {/* Search + field pills */}
        <div className="mt-10 space-y-4">
          <label className="flex h-12 items-center gap-3 border border-ink px-4 focus-within:outline-2 focus-within:outline-offset-2 focus-within:outline-[var(--focus)]">
            <Search size={20} aria-hidden="true" />
            <span className="sr-only">{d.search}</span>
            <input
              type="search"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder={d.search}
              className="h-full flex-1 bg-transparent text-[15px] outline-none placeholder:text-ink-soft"
            />
          </label>
          <div role="group" aria-label={d.title} className="-mx-4 flex gap-2 overflow-x-auto px-4 pb-1 sm:mx-0 sm:flex-wrap sm:overflow-visible sm:px-0 sm:pb-0">
            <button
              type="button"
              aria-pressed={active === null}
              onClick={() => setActive(null)}
              className={`inline-flex min-h-11 shrink-0 items-center rounded-full border border-ink px-3.5 py-1.5 text-[14px] sm:min-h-0 ${active === null ? 'bg-highlight font-body italic text-[#111]' : 'hover:bg-zinc-100 dark:hover:bg-zinc-800'}`}
            >
              {d.all}
            </button>
            {usedFields.map((f) => {
              const on = active === f;
              return (
                <button
                  key={f}
                  type="button"
                  aria-pressed={on}
                  onClick={() => setActive(on ? null : f)}
                  className={`group inline-flex min-h-11 shrink-0 items-center gap-1.5 whitespace-nowrap rounded-full border border-ink px-3.5 py-1.5 text-[14px] sm:min-h-0 ${on ? 'bg-highlight font-body italic text-[#111]' : 'hover:bg-zinc-100 dark:hover:bg-zinc-800'}`}
                >
                  {m.fields[f]}
                  {on ? <X size={20} aria-hidden="true" /> : <Plus size={20} aria-hidden="true" className="transition-transform group-hover:rotate-90 motion-reduce:transition-none" />}
                </button>
              );
            })}
          </div>
        </div>

        {active === null && <PublicCVs query={query} />}

        <div className="mt-14 flex items-baseline justify-between gap-4 border-t border-ink pt-4">
          <h2 className="font-title text-3xl md:text-4xl">{d.examplesTitle}</h2>
          <p className="font-mono text-[12px] text-ink-soft" aria-live="polite">{fmt(d.count, { count: list.length })}</p>
        </div>
        {/* Said where it applies: the made-up profiles, not the CVs people shared above. */}
        <p className="mt-3 flex items-start gap-2 text-[13px] text-ink-soft">
          <Info size={20} aria-hidden="true" className="mt-0.5 shrink-0" />
          {d.examples}
        </p>
        {list.length ? (
          <ul className="mt-3 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {list.map((p) => (
              <li key={p.id}>
                <CVCard person={p} root="../" />
              </li>
            ))}
          </ul>
        ) : (
          <p className="mt-6 font-body text-xl">{d.empty}</p>
        )}
      </main>

      <footer className="border-t border-ink">
        <div className="mx-auto flex max-w-6xl xl:max-w-none xl:px-12 flex-col gap-6 px-4 py-10 sm:flex-row sm:items-center sm:justify-between sm:px-8">
          <Wordmark href="../" />
          <p className="font-body text-[15px] text-ink-soft">{m.home.footer}</p>
        </div>
      </footer>
    </div>
  );
}
