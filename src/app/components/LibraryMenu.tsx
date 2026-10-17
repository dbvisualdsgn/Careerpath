import { useState } from 'react';
import { Check, ChevronDown, FileUp, Files, Plus } from 'lucide-react';
import { Popover, PopoverContent, PopoverTrigger } from './ui/popover';
import { Portrait } from './Portrait';
import { fmt, useI18n } from '../i18n';
import type { CVEntry } from '../cv/library';

interface LibraryMenuProps {
  items: CVEntry[];
  activeId: string;
  onSelect: (id: string) => void;
  onNew: () => void;
  onImportPdf: () => void;
  compact?: boolean;
}

function relative(ts: number, locale: string) {
  const diff = (ts - Date.now()) / 1000;
  const rtf = new Intl.RelativeTimeFormat(locale, { numeric: 'auto' });
  const steps: [number, Intl.RelativeTimeFormatUnit][] = [[60, 'second'], [60, 'minute'], [24, 'hour'], [7, 'day'], [4.35, 'week'], [12, 'month'], [Infinity, 'year']];
  let value = diff;
  for (const [size, unit] of steps) {
    if (Math.abs(value) < size) return rtf.format(Math.round(value), unit);
    value /= size;
  }
  return '';
}

/** "My CVs": every CV in this browser, the open one marked, plus New CV and Import from PDF. */
export function LibraryMenu({ items, activeId, onSelect, onNew, onImportPdf, compact = false }: LibraryMenuProps) {
  const { m, locale } = useI18n();
  const l = m.library;
  const [open, setOpen] = useState(false);
  const sorted = [...items].sort((a, b) => b.updatedAt - a.updatedAt);
  const run = (fn: () => void) => () => {
    setOpen(false);
    fn();
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <button
          type="button"
          aria-label={`${l.title} (${items.length})`}
          className="inline-flex h-9 items-center gap-1.5 rounded-sm px-2 text-[13px] text-ink hover:bg-zinc-100 data-[state=open]:bg-zinc-200 sm:px-2.5"
        >
          <Files size={16} aria-hidden="true" />
          <span className={compact ? 'hidden' : 'hidden whitespace-nowrap xl:inline'}>{l.title}</span>
          <span className="font-mono text-[11px] tabular-nums text-ink-soft" aria-hidden="true">{items.length}</span>
          <ChevronDown size={14} aria-hidden="true" />
        </button>
      </PopoverTrigger>
      <PopoverContent align="start" aria-label={l.title} className="w-[22rem] max-w-[calc(100vw-2rem)] rounded-sm border-ink bg-paper p-0 text-ink">
        <p className="flex justify-between border-b border-rule px-4 py-2.5 font-mono text-[11px] uppercase tracking-[0.14em] text-ink-soft">
          <span>{l.title}</span>
          <span>{fmt(l.count, { count: items.length })}</span>
        </p>
        <ul className="max-h-[50vh] overflow-y-auto">
          {sorted.map((it) => {
            const current = it.id === activeId;
            const name = it.cv.profile.name || l.untitled;
            return (
              <li key={it.id} className="border-b border-rule last:border-b-0">
                <button
                  type="button"
                  onClick={run(() => onSelect(it.id))}
                  aria-current={current ? 'true' : undefined}
                  className={`flex w-full items-center gap-3 px-4 py-3 text-left hover:bg-zinc-100 ${current ? 'bg-zinc-100' : ''}`}
                >
                  <Portrait photo={it.cv.profile.photo} name={name} className="h-10 w-10 shrink-0 text-sm" />
                  <span className="min-w-0 flex-1">
                    <span className="block truncate font-reading text-[16px]">{current ? <span className="hl">{name}</span> : name}</span>
                    <span className="block truncate text-[12px] text-ink-soft">{it.name || it.cv.profile.headline || '—'}</span>
                    <span className="block font-mono text-[11px] text-ink-soft">
                      {current ? l.current : fmt(l.edited, { time: relative(it.updatedAt, locale) })}
                    </span>
                  </span>
                  {current && <Check size={16} aria-hidden="true" className="shrink-0" />}
                </button>
              </li>
            );
          })}
        </ul>
        <div className="grid grid-cols-2 border-t border-ink">
          <button type="button" onClick={run(onNew)} className="flex items-center justify-center gap-2 border-r border-rule px-3 py-3 text-[13px] hover:bg-ink hover:text-paper">
            <Plus size={15} aria-hidden="true" /> {l.newCv}
          </button>
          <button type="button" onClick={run(onImportPdf)} className="flex items-center justify-center gap-2 px-3 py-3 text-[13px] hover:bg-ink hover:text-paper">
            <FileUp size={15} aria-hidden="true" /> {l.importPdf}
          </button>
        </div>
      </PopoverContent>
    </Popover>
  );
}
