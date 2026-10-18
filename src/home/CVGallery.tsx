import { useState } from 'react';
import { Pause, Play } from 'lucide-react';
import { Portrait } from '../app/components/Portrait';
import { BrandIcon } from '../app/components/BrandIcon';
import { dateRange } from '../app/cv/format';
import { people, type Person } from '../app/cv/people';
import { useI18n } from '../app/i18n';

const label = 'font-mono text-[11px] uppercase tracking-[0.14em] text-ink-soft';

/** One example CV as a small page: who, what they do, their latest role and a few skills. */
function GalleryCard({ person, copy }: { person: Person; copy?: boolean }) {
  const { m } = useI18n();
  const { cv } = person;
  const latest = cv.experience[0];
  const tools = cv.tools.filter((t) => t.icon).slice(0, 4);
  return (
    <li className="w-[19rem] shrink-0 sm:w-[21rem]">
      <a
        href={`app/?person=${person.id}`}
        tabIndex={copy ? -1 : undefined}
        aria-label={`${cv.profile.name}, ${cv.profile.headline}. ${m.directory.open}`}
        className="flex h-full flex-col border border-ink bg-paper p-6 hover:bg-zinc-50"
      >
        <span className={`flex justify-between ${label}`} aria-hidden="true">
          <span>{m.fields[person.field]}</span>
          <span>1 / 1</span>
        </span>
        <span className="mt-6 flex items-start justify-between gap-4">
          <span className="min-w-0">
            <span className="block font-title text-[28px] leading-[0.95] tracking-[-0.02em]">{cv.profile.name}</span>
            <span className="mt-2 block font-body text-[15px] leading-snug text-ink-soft">{cv.profile.headline}</span>
          </span>
          <Portrait name={cv.profile.name} className="h-12 w-12 shrink-0 text-base" />
        </span>
        {latest && (
          <span className="mt-6 block border-t border-ink pt-3">
            <span className="flex items-baseline justify-between gap-3">
              <span className="font-title text-[15px] font-medium leading-tight">{latest.title}</span>
              <span className="shrink-0 font-mono text-[11px] text-ink-soft">{dateRange(latest.start, latest.end)}</span>
            </span>
            <span className="mt-0.5 block font-body text-[13px] text-ink-soft">{latest.company}</span>
            {latest.bullets[0] && <span className="mt-2 line-clamp-2 block font-body text-[14px] leading-snug">– {latest.bullets[0]}</span>}
          </span>
        )}
        <span className="mt-auto flex items-end justify-between gap-3 pt-5">
          <span className="flex flex-wrap gap-1.5">
            {cv.skills.slice(0, 3).map((s, i) => (
              <span key={s} className={`rounded-full border border-ink px-2 py-0.5 font-body text-[12px] ${i === 0 ? 'bg-highlight italic text-[#111]' : ''}`}>{s}</span>
            ))}
          </span>
          {tools.length > 0 && (
            <span className="flex shrink-0 gap-1" aria-hidden="true">
              {tools.map((t) => <BrandIcon key={t.id} src={t.icon} name={t.name} size={16} />)}
            </span>
          )}
        </span>
      </a>
    </li>
  );
}

/** A row that drifts sideways forever. The list is drawn twice so the loop has no seam;
 *  the copy is hidden from screen readers and the keyboard. */
function Row({ items, reverse, paused }: { items: Person[]; reverse?: boolean; paused: boolean }) {
  return (
    <div className="gallery-row overflow-hidden" data-paused={paused || undefined}>
      <div className={`gallery-track flex w-max gap-4 ${reverse ? 'gallery-reverse' : ''}`}>
        <ul className="flex gap-4">
          {items.map((p) => <GalleryCard key={p.id} person={p} />)}
        </ul>
        <ul className="gallery-copy flex gap-4" aria-hidden="true">
          {items.map((p) => <GalleryCard key={p.id} person={p} copy />)}
        </ul>
      </div>
    </div>
  );
}

/** Example CVs as a slow two-row gallery. Pauses on hover, on focus and with its button; still under reduced motion. */
export function CVGallery() {
  const { m } = useI18n();
  const [paused, setPaused] = useState(false);
  const half = Math.ceil(people.length / 2);
  return (
    <div className="space-y-4">
      <div className="mx-auto flex max-w-6xl xl:max-w-none xl:px-12 justify-end px-4 sm:px-8">
        <button
          type="button"
          onClick={() => setPaused((p) => !p)}
          aria-pressed={paused}
          className="gallery-toggle inline-flex h-9 items-center gap-2 rounded-sm border border-ink px-3 font-sans text-[13px] hover:bg-ink hover:text-paper"
        >
          {paused ? <Play size={20} aria-hidden="true" /> : <Pause size={20} aria-hidden="true" />}
          {paused ? m.gallery.play : m.gallery.pause}
        </button>
      </div>
      <Row items={people.slice(0, half)} paused={paused} />
      <Row items={people.slice(half)} reverse paused={paused} />
    </div>
  );
}
