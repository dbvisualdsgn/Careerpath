import { useState } from 'react';
import { ScanEye } from 'lucide-react';
import { useI18n } from '../i18n';

/** Switches the CV to what a recruiter takes in on a first pass: names, titles, companies, dates, first results. */
export function SkimToggle({ on, onChange }: { on: boolean; onChange: (on: boolean) => void }) {
  const { m } = useI18n();
  const s = m.skim;
  // Announce "off" only after the person has switched it, not on page load.
  const [touched, setTouched] = useState(false);
  return (
    <div className="flex flex-col gap-2 border-y border-rule py-3 sm:flex-row sm:items-center sm:gap-4">
      <button
        type="button"
        aria-pressed={on}
        aria-describedby="skim-hint"
        onClick={() => {
          setTouched(true);
          onChange(!on);
        }}
        className={`inline-flex h-9 shrink-0 items-center gap-2 self-start rounded-sm border border-ink px-3 font-sans text-[14px] font-medium sm:self-auto ${
          on ? 'bg-ink text-paper' : 'hover:bg-ink hover:text-paper'
        }`}
      >
        <ScanEye size={20} aria-hidden="true" />
        {s.label}
      </button>
      <p id="skim-hint" className="font-sans text-[13px] leading-snug text-ink-soft">{s.hint}</p>
      <p className="sr-only" role="status">{on ? s.on : touched ? s.off : ''}</p>
    </div>
  );
}
