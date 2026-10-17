import { useId } from 'react';
import { Globe, Lock } from 'lucide-react';
import { useI18n } from '../i18n';

interface PrivacySwitchProps {
  isPublic: boolean;
  onChange: (isPublic: boolean) => void;
  /** Show the explanation under the switch (editor) or keep it compact (header). */
  withHint?: boolean;
  /** Hide the word labels (the switch keeps its accessible name). */
  compact?: boolean;
}

/** Private / Public toggle. A real switch (role="switch") with both states labelled in words. */
export function PrivacySwitch({ isPublic, onChange, withHint = false, compact = false }: PrivacySwitchProps) {
  const { m } = useI18n();
  const p = m.privacy;
  const hintId = useId();
  return (
    <div className={withHint ? 'space-y-2' : ''}>
      <button
        type="button"
        role="switch"
        aria-checked={isPublic}
        aria-label={`${p.label}: ${isPublic ? p.public : p.private}`}
        aria-describedby={hintId}
        title={p.listedHint}
        onClick={() => onChange(!isPublic)}
        className="group inline-flex h-9 items-center gap-2 rounded-sm px-1.5 text-[13px] text-ink hover:bg-zinc-100 dark:hover:bg-zinc-800"
      >
        <span className={`hidden items-center gap-1 ${compact ? '' : 'xl:inline-flex'} ${isPublic ? 'text-ink-soft' : 'font-medium'}`}>
          <Lock size={13} aria-hidden="true" />
          {p.private}
        </span>
        <span
          aria-hidden="true"
          className={`relative h-5 w-9 shrink-0 rounded-full border border-ink transition-colors duration-200 motion-reduce:transition-none ${isPublic ? 'bg-highlight' : 'bg-transparent'}`}
        >
          <span
            className={`absolute top-1/2 left-0.5 h-3.5 w-3.5 -translate-y-1/2 rounded-full bg-ink transition-transform duration-200 ease-out motion-reduce:transition-none ${isPublic ? 'translate-x-4' : ''}`}
          />
        </span>
        <span className={`inline-flex items-center gap-1 ${isPublic ? 'font-medium' : 'text-ink-soft'}`}>
          <Globe size={13} aria-hidden="true" className={compact ? 'hidden' : 'hidden xl:inline'} />
          <span className={compact ? 'hidden' : 'hidden xl:inline'}>{p.public}</span>
          <span className={compact ? 'whitespace-nowrap' : 'whitespace-nowrap xl:hidden'}>{isPublic ? p.public : p.private}</span>
        </span>
      </button>
      {withHint ? (
        <p id={hintId} className="text-[12px] leading-snug text-ink-soft" aria-live="polite">
          {isPublic ? `${p.publicHint} ${p.note}` : `${p.privateHint} ${p.listedHint}`}
        </p>
      ) : (
        <span id={hintId} className="sr-only">{p.listedHint}</span>
      )}
    </div>
  );
}
