import { useEffect, useId, useState } from 'react';
import { ArrowUpRight, Flag } from 'lucide-react';
import { Portrait } from '../app/components/Portrait';
import { isBackendReady, listPublicCVs, reportCV, type PublicCV } from '../app/cv/backend';
import { fmt, useI18n } from '../app/i18n';

const label = 'whitespace-nowrap font-mono text-[11px] uppercase tracking-[0.14em] text-ink-soft';

/** Report a listed CV (spam, someone else's data…). One short choice, no account. */
function Report({ id, name }: { id: string; name: string }) {
  const { m } = useI18n();
  const r = m.report;
  const [open, setOpen] = useState(false);
  const [sent, setSent] = useState(false);
  const [reason, setReason] = useState('spam');
  const groupId = useId();
  if (sent) return <p className="px-5 pb-4 text-[12px] text-ink-soft" role="status">{r.thanks}</p>;
  if (!open)
    return (
      <button type="button" onClick={() => setOpen(true)} aria-label={fmt(r.buttonLabel, { name })} className="mx-5 mb-3 inline-flex min-h-9 items-center gap-1.5 self-start text-[13px] text-ink-soft underline underline-offset-4 hover:text-ink">
        <Flag size={20} aria-hidden="true" />
        {r.button}
      </button>
    );
  return (
    <form
      className="mx-5 mb-4 space-y-2 border border-rule p-3 text-[13px]"
      onSubmit={async (e) => {
        e.preventDefault();
        await reportCV(id, reason).catch(() => undefined);
        setSent(true);
      }}
    >
      <fieldset>
        <legend className="mb-1.5 font-medium">{r.why}</legend>
        {(['spam', 'notTheirs', 'offensive'] as const).map((k) => (
          <label key={k} className="flex items-center gap-2 py-0.5">
            <input type="radio" name={groupId} value={k} checked={reason === k} onChange={() => setReason(k)} className="accent-[var(--ink)]" />
            {r[k]}
          </label>
        ))}
      </fieldset>
      <div className="flex gap-2">
        <button type="submit" className="h-8 rounded-sm bg-ink px-3 text-[12px] text-paper">{r.send}</button>
        <button type="button" onClick={() => setOpen(false)} className="h-8 rounded-sm border border-ink px-3 text-[12px]">{r.cancel}</button>
      </div>
    </form>
  );
}

/** CVs whose owners chose to show them here. Hidden when the site has no public CV server. */
export function PublicCVs({ query }: { query: string }) {
  const { m } = useI18n();
  const d = m.directory;
  const [items, setItems] = useState<PublicCV[] | null>(null);
  useEffect(() => {
    if (!isBackendReady()) return;
    listPublicCVs().then(setItems, () => setItems([]));
  }, []);
  if (!isBackendReady()) return null;
  const q = query.trim().toLowerCase();
  const shown = (items ?? []).filter((p) => {
    if (!q) return true;
    const cv = p.cv;
    return [cv.profile.name, cv.profile.headline, cv.profile.location, ...cv.skills].join(' ').toLowerCase().includes(q);
  });
  return (
    <section aria-labelledby="public-cvs" className="mt-14">
      <div className="flex items-baseline justify-between gap-4 border-t border-ink pt-4">
        <h2 id="public-cvs" className="font-title text-3xl md:text-4xl">{d.publicTitle}</h2>
        <p className="font-mono text-[12px] text-ink-soft" aria-live="polite">{items ? fmt(d.count, { count: shown.length }) : d.loading}</p>
      </div>
      <p className="mt-3 max-w-[60ch] font-body text-lg text-ink-soft">{d.publicIntro}</p>
      {items && shown.length === 0 ? (
        <p className="mt-6 font-body text-lg">{q ? d.empty : d.publicEmpty}</p>
      ) : (
        <ul className="mt-6 grid border-l border-t border-rule sm:grid-cols-2 lg:grid-cols-3">
          {shown.map((p) => (
            <li key={p.id} className="flex flex-col border-b border-r border-rule bg-paper">
              <a href={`../app/?id=${p.id}`} className="flex flex-1 flex-col p-5 hover:bg-zinc-50">
                <div className="flex items-start justify-between gap-4">
                  <Portrait photo={p.cv.profile.photo} name={p.cv.profile.name} className="h-16 w-16 text-2xl" />
                  <span className={label}>{d.publicBadge}</span>
                </div>
                <h3 className="mt-6 font-title text-2xl leading-tight">{p.cv.profile.name || m.library.untitled}</h3>
                <p className="mt-1 font-body text-[15px] text-ink-soft">{p.cv.profile.headline}</p>
                <p className="mt-3 font-mono text-[12px] text-ink-soft">{p.cv.profile.location}</p>
                <p className="mt-4 text-[13px] leading-relaxed text-ink-soft">{p.cv.skills.slice(0, 3).join(' · ')}</p>
                <span className="nudge-up mt-auto inline-flex items-center gap-1 pt-5 text-[14px] underline decoration-1 underline-offset-[6px]">
                  {d.open}
                  <ArrowUpRight size={20} aria-hidden="true" />
                </span>
              </a>
              <Report id={p.id} name={p.cv.profile.name || m.library.untitled} />
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
