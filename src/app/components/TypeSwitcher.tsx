import { useId } from 'react';
import { ALargeSmall } from 'lucide-react';
import { Popover, PopoverContent, PopoverTrigger } from './ui/popover';
import { typeStyles, useTypeStyle } from '../typography';
import { useI18n } from '../i18n';

const sampleFont = { sans: 'var(--font-sans)', serif: 'var(--font-serif)', mono: 'var(--font-mono)' } as const;

/** Kindle-style "Aa" menu: native radio buttons, each label set in its own typeface. */
export function TypeSwitcher() {
  const { m } = useI18n();
  const [type, setType] = useTypeStyle();
  const name = useId();
  return (
    <Popover>
      <PopoverTrigger asChild>
        <button
          type="button"
          aria-label={m.type.label}
          title={m.type.label}
          className="inline-flex h-9 w-9 items-center justify-center rounded-sm text-ink hover:bg-zinc-100 dark:hover:bg-zinc-800"
        >
          <ALargeSmall size={18} aria-hidden="true" />
        </button>
      </PopoverTrigger>
      <PopoverContent align="end" aria-label={m.type.label} className="w-64 rounded-sm border-rule bg-paper p-0 text-ink">
        <fieldset>
          <legend className="w-full border-b border-rule px-4 py-2.5 font-mono text-[11px] uppercase tracking-[0.14em] text-ink-soft">
            {m.type.label}
          </legend>
          {typeStyles.map((style) => (
            <label
              key={style}
              className="flex cursor-pointer items-center justify-between gap-3 border-b border-rule px-4 py-3 last:border-b-0 hover:bg-zinc-100 has-[:focus-visible]:outline-2 has-[:focus-visible]:-outline-offset-2 has-[:focus-visible]:outline-[var(--focus)] dark:hover:bg-zinc-800"
            >
              <span className="flex items-baseline gap-3" style={{ fontFamily: sampleFont[style] }}>
                <span className="text-2xl leading-none" aria-hidden="true">Aa</span>
                <span className="text-base">{m.type[style]}</span>
              </span>
              <input
                type="radio"
                name={name}
                value={style}
                checked={type === style}
                onChange={() => setType(style)}
                className="h-4 w-4 accent-[var(--ink)] focus-visible:outline-none"
              />
            </label>
          ))}
        </fieldset>
      </PopoverContent>
    </Popover>
  );
}
