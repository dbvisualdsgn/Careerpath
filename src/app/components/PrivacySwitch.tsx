import { useId } from 'react';
import { Link2, Lock } from 'lucide-react';
import { useI18n } from '../i18n';

interface PrivacySwitchProps {
  isPublic: boolean;
  onChange: (isPublic: boolean) => void;
  /** Show the explanation under the switch (editor) or keep it compact (header). */
  withHint?: boolean;
  /** Publishing or taking down: the switch waits. */
  busy?: boolean;
}

/** Private / Public toggle. A real switch (role="switch") with its current state in words. */
export function PrivacySwitch({ isPublic, onChange, withHint = false, busy = false }: PrivacySwitchProps) {
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
        disabled={busy}
        aria-busy={busy}
        className="group inline-flex h-9 items-center gap-2 rounded-sm px-1.5 text-[13px] text-ink hover:bg-zinc-100 disabled:cursor-wait disabled:opacity-60"
      >
        <span
          aria-hidden="true"
          className={`relative h-5 w-9 shrink-0 rounded-full border border-ink transition-colors duration-200 motion-reduce:transition-none ${isPublic ? 'bg-highlight' : 'bg-transparent'}`}
        >
          <span
            className={`absolute top-1/2 left-0.5 h-3.5 w-3.5 -translate-y-1/2 rounded-full bg-ink transition-transform duration-200 ease-out motion-reduce:transition-none ${isPublic ? 'translate-x-4' : ''}`}
          />
        </span>
        <span className="inline-flex items-center gap-1 whitespace-nowrap font-medium">
          {isPublic ? <Link2 size={20} aria-hidden="true" /> : <Lock size={20} aria-hidden="true" />}
          {/* In the header the word gives way between lg and xl, where the bar is tightest. */}
          <span className={withHint ? '' : 'lg:max-xl:hidden'}>{isPublic ? p.public : p.private}</span>
        </span>
      </button>
      {withHint ? (
        <p id={hintId} className="text-[12px] leading-snug text-ink-soft" aria-live="polite">
          {isPublic ? p.publicHint : p.privateHint}
        </p>
      ) : (
        <span id={hintId} className="sr-only">{p.listedHint}</span>
      )}
    </div>
  );
}
