import { ReadingControls } from './ReadingControls';
import { Wordmark } from './Wordmark';
import { useI18n } from '../i18n';

/** Header for the homepage and the example CVs page. `root` is the relative path to the site root. */
export function SiteHeader({ root, current }: { root: string; current?: 'home' | 'people' }) {
  const { m } = useI18n();
  return (
    <header className="sticky top-0 z-40 border-b border-rule bg-paper">
      <nav aria-label={m.app.home} className="mx-auto flex h-16 max-w-6xl xl:max-w-none xl:px-12 items-center justify-between gap-2 px-4 sm:px-8 md:grid md:grid-cols-[1fr_auto_1fr]">
        <Wordmark href={root} />
        <ReadingControls />
        <div className="flex items-center gap-1 md:justify-self-end">
          <a
            href={`${root}people/`}
            aria-current={current === 'people' ? 'page' : undefined}
            className="mr-1 hidden rounded-sm px-2 py-1 text-sm underline-offset-[6px] hover:underline aria-[current=page]:underline md:inline"
          >
            {m.directory.nav}
          </a>
          <a href={`${root}app/`} className="ml-1 hidden h-9 items-center gap-2 rounded-sm border border-ink px-3 text-sm hover:bg-ink hover:text-paper sm:inline-flex">
            {m.home.openCV}
          </a>
        </div>
      </nav>
    </header>
  );
}
