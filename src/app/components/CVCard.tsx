import { BrandIcon } from './BrandIcon';
import { Portrait } from './Portrait';
import { avatarOf, dateRange } from '../cv/format';
import type { Person } from '../cv/people';
import { useI18n } from '../i18n';

const microLabel = 'font-mono text-[11px] uppercase tracking-[0.14em] text-ink-soft';

interface CVCardProps {
  person: Person;
  /** Relative path from this page to the site root, e.g. "./" or "../". */
  root: string;
  /** The gallery's second, decorative copy: out of the tab order. */
  copy?: boolean;
  className?: string;
}

/** An example CV as a small sheet in the current template: avatar (if any) and name, latest role, a few skills. */
export function CVCard({ person, root, copy, className = '' }: CVCardProps) {
  const { m } = useI18n();
  const { cv } = person;
  const { name, headline } = cv.profile;
  const avatar = person.photo ? 'photo' : avatarOf(cv.profile);
  const latest = cv.experience[0];
  const tools = cv.tools.filter((t) => t.icon).slice(0, 4);
  return (
    <a
      href={`${root}app/?person=${person.id}`}
      tabIndex={copy ? -1 : undefined}
      aria-label={`${name}, ${headline}. ${m.directory.open}`}
      className={`flex h-full flex-col border border-rule p-6 shadow-[0_1px_0_var(--rule),0_12px_32px_-18px_rgb(0_0_0/0.25)] transition-colors hover:border-ink motion-reduce:transition-none ${className}`}
    >
      <span className={`grid items-start gap-4 ${avatar !== 'none' ? 'grid-cols-[4rem_minmax(0,1fr)]' : ''}`}>
        {avatar !== 'none' && (
          <Portrait photo={avatar === 'photo' ? `${root}${person.photo}` : undefined} name={name} className="aspect-square w-16 text-[1.75rem]" />
        )}
        <span className="min-w-0">
          <span className={`block ${microLabel}`}>{m.fields[person.field]}</span>
          <span className="mt-2 block font-title text-[26px] leading-[0.95] hyphens-auto [overflow-wrap:anywhere]">{name}</span>
          <span className="mt-2 block font-title text-[15px] leading-snug text-ink-soft">{headline}</span>
        </span>
      </span>
      {latest && (
        <span className="mt-6 block border-t border-ink pt-3">
          <span className="block font-mono text-[11px] font-medium uppercase tracking-[0.14em] text-ink">{m.sections.experience}</span>
          <span className="mt-3 flex items-baseline justify-between gap-3">
            <span className="font-title text-[15px] font-medium leading-tight">{latest.title}</span>
            <span className="shrink-0 font-mono text-[11px] text-ink-soft">{dateRange(latest.start, latest.end)}</span>
          </span>
          <span className="mt-0.5 block font-sans text-[13px] text-ink-soft">{latest.company}</span>
          {latest.bullets[0] && (
            <span className="mt-2 grid grid-cols-[0.875rem_minmax(0,1fr)] font-body text-[14px] leading-snug">
              <span aria-hidden="true" className="text-ink-soft">–</span>
              <span className="line-clamp-2">{latest.bullets[0]}</span>
            </span>
          )}
        </span>
      )}
      <span className="mt-auto flex items-end justify-between gap-3 pt-5">
        <span className="flex flex-wrap gap-1.5">
          {cv.skills.slice(0, 3).map((s) => (
            <span key={s} className="rounded-sm border border-ink px-2 py-0.5 font-body text-[12px]">{s}</span>
          ))}
        </span>
        {tools.length > 0 && (
          <span className="flex shrink-0 gap-1" aria-hidden="true">
            {tools.map((t) => <BrandIcon key={t.id} src={t.icon} name={t.name} size={16} />)}
          </span>
        )}
      </span>
    </a>
  );
}
