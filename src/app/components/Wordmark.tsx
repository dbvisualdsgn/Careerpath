import { BookOpenText } from 'lucide-react';
import { useI18n } from '../i18n';

/** "curriculi curricula" set in the reading font, with the Lucide book mark. */
export function Wordmark({ href, compact = false }: { href: string; compact?: boolean }) {
  const { m } = useI18n();
  return (
    <a href={href} aria-label={m.app.home} className="group inline-flex items-center gap-2.5 rounded-sm text-ink">
      <span className="flex h-8 w-8 items-center justify-center rounded-sm bg-ink text-paper">
        <BookOpenText size={18} strokeWidth={1.75} aria-hidden="true" />
      </span>
      <span aria-hidden="true" className={`font-reading text-[17px] leading-none tracking-[-0.01em] ${compact ? 'hidden sm:inline' : ''}`}>
        curriculi <span className="italic">curricula</span>
      </span>
    </a>
  );
}
