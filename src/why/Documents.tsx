import { CalendarCheck, Car, Hospital, House, Plane } from 'lucide-react';
import { Portrait } from '../app/components/Portrait';
import { findPerson } from '../app/cv/people';
import { useReveal } from '../app/hooks/useReveal';
import { useI18n } from '../app/i18n';

// One person, three documents. Amara is one of the example CVs; the passport and licence are made up around her.
const AMARA = findPerson('amara-okafor')!.cv;
const NAME = AMARA.profile.name;

const tiny = 'font-mono text-[9px] uppercase leading-tight tracking-[0.08em] text-ink-soft';
const field = 'font-mono text-[11px] font-medium uppercase leading-tight text-ink';

/** The data page of a passport, with a stamp for the trip. */
function Passport() {
  return (
    <div className="w-full max-w-[15rem]">
      <div className="relative flex flex-col border border-ink bg-paper" style={{ aspectRatio: '88 / 125' }}>
        <div className="flex items-center justify-between bg-ink px-3 py-2 font-mono text-[9px] uppercase tracking-[0.14em] text-paper">
          <span>Passport</span>
          <span>GBR</span>
        </div>
        <div className="grid grid-cols-[4.5rem_minmax(0,1fr)] gap-3 p-3">
          <Portrait name={NAME} className="h-[5.75rem] w-[4.5rem] text-[1.75rem]" />
          <dl className="space-y-1.5">
            {[['Surname', 'Okafor'], ['Given names', 'Amara'], ['Nationality', 'British'], ['Date of birth', '14 Mar 1991']].map(([k, v]) => (
              <div key={k}>
                <dt className={tiny}>{k}</dt>
                <dd className={field}>{v}</dd>
              </div>
            ))}
          </dl>
        </div>
        <p className="mt-auto overflow-hidden whitespace-nowrap border-t border-rule px-3 py-2 font-mono text-[9px] leading-snug tracking-[0.06em] text-ink-soft">
          P&lt;GBROKAFOR&lt;&lt;AMARA&lt;&lt;&lt;&lt;&lt;&lt;&lt;&lt;&lt;&lt;
          <br />
          5412873094GBR9103146F&lt;&lt;&lt;&lt;
        </p>
        {/* The entry stamp lands once the plane is in */}
        <span className="doc-stamp absolute bottom-[26%] right-3 flex flex-col items-center border-2 border-[#111] bg-highlight px-2.5 py-1.5 font-mono text-[10px] font-medium uppercase leading-tight tracking-[0.1em] text-[#111]">
          <span className="text-[13px]">Roma · FCO</span>
          <span>18 Oct 2026</span>
        </span>
      </div>
      <Route mover={<Plane size={20} />} end={<span className="font-mono text-[11px]">FCO</span>} start={<span className="font-mono text-[11px]">MAN</span>} />
    </div>
  );
}

/** A credit-card licence, EU-style numbered fields. */
function Licence() {
  return (
    <div className="w-full max-w-[18rem]">
      <div className="flex flex-col rounded-lg border border-ink bg-paper p-3" style={{ aspectRatio: '85.6 / 54' }}>
        <div className="flex items-center justify-between">
          <span className="font-mono text-[9px] font-medium uppercase tracking-[0.14em] text-ink">Driving licence</span>
          <span className="bg-ink px-1.5 py-0.5 font-mono text-[9px] text-paper">UK</span>
        </div>
        <div className="mt-2 grid flex-1 grid-cols-[3.75rem_minmax(0,1fr)] gap-3">
          <Portrait name={NAME} className="h-[4.75rem] w-[3.75rem] text-[1.375rem]" />
          <ol className="space-y-0.5 font-mono text-[10px] uppercase leading-tight text-ink">
            {[['1.', 'Okafor'], ['2.', 'Amara'], ['3.', '14.03.1991'], ['4a.', '01.04.2016'], ['5.', 'OKAFO903141A99'], ['9.', 'B']].map(([n, v]) => (
              <li key={n} className="flex gap-1.5">
                <span className="w-5 shrink-0 text-ink-soft">{n}</span>
                <span className="truncate">{v}</span>
              </li>
            ))}
          </ol>
        </div>
      </div>
      <Route mover={<Car size={20} />} start={<House size={20} />} end={<span className="doc-arrive flex h-7 w-7 items-center justify-center"><Hospital size={20} /></span>} road />
    </div>
  );
}

/** Amara's CV in this site's layout, with the invitation it's for. */
function CVPage() {
  const { m } = useI18n();
  const job = AMARA.experience[0];
  return (
    <div className="w-full max-w-[15rem]">
      <div className="relative flex flex-col border border-ink bg-paper p-4" style={{ aspectRatio: '210 / 297' }}>
        <div className="grid grid-cols-[3rem_minmax(0,1fr)] gap-3">
          <Portrait name={NAME} className="aspect-square w-12 text-[1.25rem]" />
          <div className="min-w-0">
            <p className="font-title text-[19px] leading-[1.02]">{NAME}</p>
            <p className="mt-1 font-body text-[10px] leading-snug text-ink-soft">{AMARA.profile.headline}</p>
          </div>
        </div>
        <p className="mt-2 font-mono text-[9px] text-ink-soft">{AMARA.profile.location}</p>
        <div className="mt-3 border-t border-ink pt-2">
          <p className={tiny}>{m.sections.experience}</p>
          <p className="mt-1.5 font-title text-[11px] leading-tight">{job.title}</p>
          <p className="font-mono text-[9px] text-ink-soft">{job.company} · {job.start} – {job.end}</p>
          <ul className="mt-1.5 space-y-1 font-body text-[10px] leading-snug">
            <li><span className="doc-mark hl">{job.bullets[1]}</span></li>
            <li className="text-ink-soft">{job.bullets[0]}</li>
          </ul>
        </div>
        <div className="mt-3 border-t border-ink pt-2">
          <p className={tiny}>{m.sections.skills}</p>
          <p className="mt-1.5 flex flex-wrap gap-1">
            {AMARA.skills.slice(0, 4).map((k) => (
              <span key={k} className="rounded-full border border-ink px-1.5 py-px font-body text-[9px]">{k}</span>
            ))}
          </p>
        </div>
      </div>
    </div>
  );
}

/** Where the document takes you: a line from A to B and something moving along it. */
function Route({ start, end, mover, road }: { start: React.ReactNode; end: React.ReactNode; mover: React.ReactNode; road?: boolean }) {
  return (
    <div className="mt-6 flex items-center gap-3 text-ink">
      <span className="shrink-0">{start}</span>
      <span className={`relative h-px flex-1 ${road ? 'border-t-2' : 'border-t'} border-dashed border-ink`}>
        <span className="doc-travel absolute -top-[11px] left-[calc(100%-20px)] bg-paper">{mover}</span>
      </span>
      <span className="shrink-0">{end}</span>
    </div>
  );
}

/** The interview the CV is for: an invitation that pops in once the result is marked. */
function Invite() {
  const { m } = useI18n();
  const w = m.why;
  return (
    <p className="doc-pop mt-6 flex items-center gap-3 bg-ink px-3 py-2 text-paper">
      <CalendarCheck size={20} aria-hidden="true" className="shrink-0" />
      <span className="font-mono text-[11px] uppercase tracking-[0.12em]">{w.invite} · {w.inviteWhen}</span>
    </p>
  );
}

/** Passport, licence and CV for the same person, each doing its job. Loops; the page's Pause button stops it. */
export function Documents() {
  const { m } = useI18n();
  const w = m.why;
  const ref = useReveal<HTMLUListElement>(0.2);
  const docs = [
    { name: w.passport, does: w.toRome, art: <Passport /> },
    { name: w.licence, does: w.toHospital, art: <Licence /> },
    { name: w.cv, does: w.toInterview, art: <><CVPage /><Invite /></>, ours: true },
  ];
  return (
    <ul ref={ref} className="docs mt-12 grid gap-px border border-ink bg-ink lg:grid-cols-3">
      {docs.map((d, i) => (
        <li key={d.name} className="flex min-w-0 flex-col bg-paper p-6 md:p-8" style={{ '--doc-delay': `${i * 0.5}s` } as React.CSSProperties}>
          <div className="flex items-start justify-between gap-4">
            <span className="font-mono text-[11px] uppercase tracking-[0.14em] text-ink-soft">{d.name}</span>
            <span className="font-mono text-[11px] tabular-nums text-ink-soft" aria-hidden="true">{i + 1} / 3</span>
          </div>
          <div aria-hidden="true" className="flex flex-1 flex-col items-center justify-center py-10">
            {d.art}
          </div>
          <p className="font-title text-2xl leading-tight hyphens-auto [overflow-wrap:anywhere] md:text-3xl">
            <span className="sr-only">{d.name}: </span>
            {d.ours ? <span className="hl">{d.does}</span> : d.does}
          </p>
        </li>
      ))}
    </ul>
  );
}
