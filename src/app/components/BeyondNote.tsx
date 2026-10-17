import { X } from 'lucide-react';
import { useI18n } from '../i18n';

const KEY = 'curricula.tip.beyond';

/** True until the person has closed the note once. */
export function beyondNoteWanted() {
  try {
    return localStorage.getItem(KEY) === null;
  } catch {
    return true;
  }
}

/** One calm line after a download: the CV is only part of getting the job. Closed for good once dismissed. */
export function BeyondNote({ onClose }: { onClose: () => void }) {
  const { m } = useI18n();
  const b = m.beyond;
  return (
    <div className="border-t border-rule bg-panel print:hidden">
      <div className="mx-auto flex max-w-4xl items-start gap-3 px-4 py-3 sm:px-6 xl:max-w-6xl 2xl:max-w-7xl">
        <p className="flex-1 font-sans text-[14px] leading-snug">
          <span className="font-mono text-[11px] uppercase tracking-[0.12em] text-ink-soft">{b.title} · </span>
          {b.body}
        </p>
        <button
          type="button"
          aria-label={b.close}
          onClick={() => {
            try {
              localStorage.setItem(KEY, '1');
            } catch {
              // Not critical: it just shows again next time.
            }
            onClose();
          }}
          className="inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-sm hover:bg-zinc-100"
        >
          <X size={20} aria-hidden="true" />
        </button>
      </div>
    </div>
  );
}
