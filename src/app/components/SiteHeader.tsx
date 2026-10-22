import { useEffect, useId, useState } from 'react';
import { Menu, X } from 'lucide-react';
import { ReadingControls } from './ReadingControls';
import { Wordmark } from './Wordmark';
import { useI18n } from '../i18n';

/** Header for the homepage and the example CVs page. `root` is the relative path to the site root.
 *  Below md the links sit behind a Menu button, so "Open my CV" is always one tap away; below sm the
 *  reading controls move into that panel too, since the wordmark keeps its full width. */
export function SiteHeader({ root, current }: { root: string; current?: 'home' | 'people' | 'why' }) {
  const { m } = useI18n();
  const [open, setOpen] = useState(false);
  const panelId = useId();
  useEffect(() => {
    if (!open) return;
    const close = (e: KeyboardEvent) => e.key === 'Escape' && setOpen(false);
    window.addEventListener('keydown', close);
    return () => window.removeEventListener('keydown', close);
  }, [open]);

  const links = [
    { href: `${root}why/`, label: m.why.nav, page: 'why' },
    { href: `${root}people/`, label: m.directory.nav, page: 'people' },
  ] as const;

  return (
    <header className="sticky top-0 z-40 border-b border-rule bg-paper">
      <nav aria-label={m.app.home} className="mx-auto flex h-16 max-w-6xl xl:max-w-none xl:px-12 items-center justify-between gap-2 px-4 sm:px-8 md:grid md:grid-cols-[1fr_auto_1fr]">
        <Wordmark href={root} />
        <div className="hidden sm:block">
          <ReadingControls />
        </div>
        <div className="flex items-center gap-1 md:justify-self-end">
          {links.map((l) => (
            <a
              key={l.page}
              href={l.href}
              aria-current={current === l.page ? 'page' : undefined}
              className="mr-1 hidden rounded-sm px-2 py-1 text-sm underline-offset-[6px] hover:underline aria-[current=page]:underline md:inline"
            >
              {l.label}
            </a>
          ))}
          <a href={`${root}app/`} className="ml-1 hidden h-9 items-center gap-2 rounded-sm border border-ink px-3 text-sm hover:bg-ink hover:text-paper md:inline-flex">
            {m.home.openCV}
          </a>
          <button
            type="button"
            onClick={() => setOpen((o) => !o)}
            aria-expanded={open}
            aria-controls={panelId}
            className="inline-flex h-11 items-center gap-2 rounded-sm px-2 text-sm hover:bg-zinc-100 aria-expanded:bg-ink aria-expanded:text-paper md:hidden"
          >
            {open ? <X size={20} aria-hidden="true" /> : <Menu size={20} aria-hidden="true" />}
            {m.app.menu}
          </button>
        </div>
      </nav>
      <div id={panelId} hidden={!open} className="border-t border-rule md:hidden">
        <ul className="mx-auto max-w-6xl px-4 sm:px-8">
          <li className="border-b border-rule py-3">
            <a href={`${root}app/`} className="inline-flex h-11 w-full items-center justify-center rounded-sm bg-ink px-4 text-[15px] font-medium text-paper hover:opacity-90">
              {m.home.openCV}
            </a>
          </li>
          {links.map((l) => (
            <li key={l.page} className="border-b border-rule last:border-b-0">
              <a
                href={l.href}
                aria-current={current === l.page ? 'page' : undefined}
                className="flex min-h-12 items-center font-title text-xl aria-[current=page]:underline aria-[current=page]:underline-offset-[6px]"
              >
                {l.label}
              </a>
            </li>
          ))}
        </ul>
        <div className="flex justify-center border-t border-rule py-2 sm:hidden">
          <ReadingControls />
        </div>
      </div>
    </header>
  );
}
