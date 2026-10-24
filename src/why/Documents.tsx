import { useReveal } from '../app/hooks/useReveal';
import { useI18n } from '../app/i18n';
import { CV_SVG, LICENCE_SVG, PASSPORT_SVG } from './docsFigures';
import './docs.css';

// One person, three documents: Amara Okafor is one of the example CVs; the passport and licence are made up
// around her. Each is an isometric scene drawn with the Anatomy kit, like the homepage desk.
const escape = (text: string) => text.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

/** A scene from scripts/desk-hero/docs.mjs, in the site's colours. Decorative: the caption says what it shows. */
function Scene({ svg }: { svg: string }) {
  return <div className="doc-art iso iso-site w-full max-w-[34rem]" data-theme="light" dangerouslySetInnerHTML={{ __html: svg }} />;
}

/** Passport, licence and CV for the same person, each doing its job. Loops; the page's Pause button stops it. */
export function Documents() {
  const { m } = useI18n();
  const w = m.why;
  const ref = useReveal<HTMLUListElement>(0.2);
  const docs = [
    { name: w.passport, does: w.toRome, art: <Scene svg={PASSPORT_SVG} /> },
    { name: w.licence, does: w.toHospital, art: <Scene svg={LICENCE_SVG} /> },
    { name: w.cv, does: w.toInterview, art: <Scene svg={CV_SVG.replace('%INVITE%', escape(w.invite.toUpperCase())).replace('%WHEN%', escape(w.inviteWhen))} />, ours: true },
  ];
  return (
    <ul ref={ref} className="docs mt-12 grid gap-px border border-ink bg-ink lg:grid-cols-3">
      {docs.map((d, i) => (
        <li key={d.name} className="flex min-w-0 flex-col bg-paper p-6 md:p-8" style={{ '--doc-delay': `${i * 0.5}s` } as React.CSSProperties}>
          <div className="flex items-start justify-between gap-4">
            <span className="font-mono text-[11px] uppercase tracking-[0.14em] text-ink-soft">{d.name}</span>
            <span className="font-mono text-[11px] tabular-nums text-ink-soft" aria-hidden="true">{i + 1} / 3</span>
          </div>
          <div aria-hidden="true" className="flex flex-1 flex-col items-center justify-center py-6">
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
