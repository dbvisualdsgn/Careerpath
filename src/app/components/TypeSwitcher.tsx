import { useEffect, useId, useMemo, useRef, useState } from 'react';
import { Search, Type } from 'lucide-react';
import { Popover, PopoverContent, PopoverTrigger } from './ui/popover';
import { faces, setFaces, useTypeFaces } from '../typography';
import { titleFonts, type TitleCategory, type TitleFont } from '../titleFonts';
import { DEFAULT_TITLE, loadPreview, previewFamily } from '../titleFontLoader';
import { fmt, useI18n } from '../i18n';

const sampleFont = { sans: 'var(--font-sans)', serif: 'var(--font-serif)' } as const;
const categories: TitleCategory[] = ['sans', 'serif', 'display', 'slab'];
const label = 'font-mono text-[11px] uppercase tracking-[0.14em] text-ink-soft';

/** One title font, set in itself. Its file loads only once the row scrolls into view. */
function FontRow({ font, name, checked, onPick }: { font: TitleFont; name: string; checked: boolean; onPick: () => void }) {
  const ref = useRef<HTMLLabelElement>(null);
  const [ready, setReady] = useState(font.slug === DEFAULT_TITLE);
  useEffect(() => {
    if (ready || !ref.current) return;
    const io = new IntersectionObserver(([entry]) => {
      if (entry.isIntersecting) {
        io.disconnect();
        loadPreview(font.slug).then(() => setReady(true));
      }
    });
    io.observe(ref.current);
    return () => io.disconnect();
  }, [font.slug, ready]);
  const family = font.slug === DEFAULT_TITLE ? "'Title Clash Display'" : `'${previewFamily(font.slug)}'`;
  return (
    <label
      ref={ref}
      data-checked={checked || undefined}
      className="flex cursor-pointer items-center justify-between gap-3 border-b border-rule px-4 py-2.5 hover:bg-zinc-100 has-[:checked]:bg-ink has-[:checked]:text-paper has-[:focus-visible]:outline-2 has-[:focus-visible]:-outline-offset-2 has-[:focus-visible]:outline-[var(--focus)]"
    >
      <span className="truncate text-[20px] leading-tight" style={{ fontFamily: ready ? `${family}, var(--font-sans)` : 'var(--font-sans)', fontWeight: 700 }}>
        {font.name}
      </span>
      <input type="radio" name={name} value={font.slug} checked={checked} onChange={onPick} className="sr-only" />
    </label>
  );
}

/** Kindle-style menu: any vetted Fontshare family for titles (always bold), Switzer or Gambetta for text. */
export function TypeSwitcher() {
  const { m } = useI18n();
  const t = m.type;
  const current = useTypeFaces();
  const id = useId();
  const [query, setQuery] = useState('');
  const listRef = useRef<HTMLDivElement>(null);
  const shown = useMemo(() => {
    const q = query.trim().toLowerCase();
    return titleFonts.filter((f) => !q || f.name.toLowerCase().includes(q));
  }, [query]);

  // Open on the chosen font.
  const scrollToChosen = () =>
    requestAnimationFrame(() => {
      const list = listRef.current;
      const row = list?.querySelector<HTMLElement>('[data-checked]');
      if (list && row) list.scrollTop = row.offsetTop - list.clientHeight / 2 + row.clientHeight / 2;
    });

  return (
    <Popover onOpenChange={(open) => open && scrollToChosen()}>
      <PopoverTrigger asChild>
        <button
          type="button"
          aria-label={t.label}
          title={t.label}
          className="inline-flex h-11 w-11 items-center justify-center rounded-sm text-ink hover:bg-zinc-100 md:h-9 md:w-9"
        >
          <Type size={20} aria-hidden="true" />
        </button>
      </PopoverTrigger>
      <PopoverContent align="center" aria-label={t.label} className="w-[22rem] max-w-[calc(100vw-2rem)] rounded-sm border-ink bg-paper p-0 text-ink">
        <fieldset className="border-b border-rule">
          <legend className={`w-full px-4 pt-3 pb-2 ${label}`}>{t.titles}</legend>
          <div className="px-4 pb-3">
            <label htmlFor={`${id}-search`} className="sr-only">{t.search}</label>
            <div className="flex items-center gap-2 border border-rule px-2.5 focus-within:border-ink">
              <Search size={20} aria-hidden="true" className="shrink-0 text-ink-soft" />
              <input
                id={`${id}-search`}
                type="search"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder={t.search}
                aria-describedby={`${id}-count`}
                className="h-9 w-full bg-transparent text-[14px] outline-none placeholder:text-ink-soft"
              />
            </div>
            <p id={`${id}-count`} className="mt-1.5 text-[12px] text-ink-soft" aria-live="polite">
              {shown.length === 1 ? t.result : shown.length ? fmt(t.results, { count: shown.length }) : t.none}
            </p>
          </div>
          <div ref={listRef} className="relative max-h-[min(50vh,22rem)] overflow-y-auto border-t border-rule">
            {categories.map((cat) => {
              const group = shown.filter((f) => f.category === cat);
              if (!group.length) return null;
              return (
                <div key={cat}>
                  <p className={`sticky top-0 z-10 border-b border-rule bg-paper px-4 py-1.5 ${label}`}>{t[cat]}</p>
                  {group.map((font) => (
                    <FontRow
                      key={font.slug}
                      font={font}
                      name={`${id}-title`}
                      checked={current.title === font.slug}
                      onPick={() => setFaces({ title: font.slug })}
                    />
                  ))}
                </div>
              );
            })}
          </div>
        </fieldset>
        <fieldset>
          <legend className={`w-full px-4 pt-3 pb-1 ${label}`}>{t.body}</legend>
          <div className="grid grid-cols-2 gap-px px-4 pb-3">
            {faces.map((face) => (
              <label
                key={face}
                className="flex cursor-pointer items-center justify-between gap-2 border border-rule px-3 py-2.5 hover:bg-zinc-100 has-[:checked]:border-ink has-[:checked]:bg-ink has-[:checked]:text-paper has-[:focus-visible]:outline-2 has-[:focus-visible]:outline-offset-2 has-[:focus-visible]:outline-[var(--focus)]"
              >
                <span className="flex items-baseline gap-2" style={{ fontFamily: sampleFont[face] }}>
                  <span className="text-xl leading-none" aria-hidden="true">Aa</span>
                  <span className="text-[14px]">{t[face]}</span>
                </span>
                <input
                  type="radio"
                  name={`${id}-body`}
                  value={face}
                  checked={current.body === face}
                  onChange={() => setFaces({ body: face })}
                  className="sr-only"
                />
              </label>
            ))}
          </div>
        </fieldset>
      </PopoverContent>
    </Popover>
  );
}
