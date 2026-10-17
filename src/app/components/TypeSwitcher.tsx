import { useId } from 'react';
import { ALargeSmall } from 'lucide-react';
import { Popover, PopoverContent, PopoverTrigger } from './ui/popover';
import { faces, setFaces, useTypeFaces, type TypeFaces } from '../typography';
import { useI18n } from '../i18n';

const sampleFont = { sans: 'var(--font-sans)', serif: 'var(--font-serif)' } as const;

/** Kindle-style "Aa" menu: one typeface for titles, one for text. Native radios, each label in its own face. */
export function TypeSwitcher() {
  const { m } = useI18n();
  const current = useTypeFaces();
  const id = useId();
  const group = (part: keyof TypeFaces, legend: string) => (
    <fieldset className="border-b border-rule last:border-b-0">
      <legend className="w-full px-4 pt-3 pb-1 font-mono text-[11px] uppercase tracking-[0.14em] text-ink-soft">{legend}</legend>
      <div className="grid grid-cols-2 gap-px px-4 pb-3">
        {faces.map((face) => (
          <label
            key={face}
            className="flex cursor-pointer items-center justify-between gap-2 border border-rule px-3 py-2.5 hover:bg-zinc-100 has-[:checked]:border-ink has-[:checked]:bg-ink has-[:checked]:text-paper has-[:focus-visible]:outline-2 has-[:focus-visible]:outline-offset-2 has-[:focus-visible]:outline-[var(--focus)]"
          >
            <span className="flex items-baseline gap-2" style={{ fontFamily: sampleFont[face] }}>
              <span className="text-xl leading-none" aria-hidden="true">Aa</span>
              <span className="text-[14px]">{m.type[face]}</span>
            </span>
            <input
              type="radio"
              name={`${id}-${part}`}
              value={face}
              checked={current[part] === face}
              onChange={() => setFaces({ [part]: face })}
              className="sr-only"
            />
          </label>
        ))}
      </div>
    </fieldset>
  );
  return (
    <Popover>
      <PopoverTrigger asChild>
        <button
          type="button"
          aria-label={m.type.label}
          title={m.type.label}
          className="inline-flex h-9 w-9 items-center justify-center rounded-sm text-ink hover:bg-zinc-100"
        >
          <ALargeSmall size={20} aria-hidden="true" />
        </button>
      </PopoverTrigger>
      <PopoverContent align="end" aria-label={m.type.label} className="w-72 rounded-sm border-ink bg-paper p-0 text-ink">
        {group('title', m.type.titles)}
        {group('body', m.type.body)}
      </PopoverContent>
    </Popover>
  );
}
