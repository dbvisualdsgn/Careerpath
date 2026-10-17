import { useMemo } from 'react';
import { ArrowRight, ClipboardPaste, EyeOff, Plus } from 'lucide-react';
import { runAtsCheck, type Finding } from '../cv/atsCheck';
import { useCountUp, useReveal } from '../hooks/useReveal';
import { fmt, useI18n } from '../i18n';
import type { CVData } from '../cv/types';

interface AtsSummaryProps {
  cv: CVData;
  /** Job title from the pasted ad, if any. */
  targetTitle?: string;
  onOpen: (section?: Finding['section']) => void;
  /** Open the check on the job-ad box. */
  onJobAd: () => void;
}

/** The ATS check, up front on the CV page: big score, a 20-step meter and the first fixes as pills. */
export function AtsSummary({ cv, targetTitle, onOpen, onJobAd }: AtsSummaryProps) {
  const { m, locale } = useI18n();
  const report = useMemo(() => runAtsCheck(cv, locale, { targetTitle }), [cv, locale, targetTitle]);
  const shown = useCountUp(report.score);
  const ref = useReveal<HTMLElement>(0.3);
  // The fixes worth the most points come first.
  const top = [...report.findings].sort((a, b) => b.weight - a.weight).slice(0, 4);
  const label = report.score >= 85 ? m.ats.strong : report.score >= 65 ? m.ats.good : m.ats.needsWork;
  const steps = 20;
  const filled = Math.round((report.score / 100) * steps);

  return (
    <section ref={ref} aria-labelledby="ats-summary" className="reveal border border-ink p-5 print:hidden md:p-7">
      <p className="-mt-1 mb-5 flex items-center gap-2 border-b border-dashed border-rule pb-3 font-mono text-[11px] uppercase tracking-[0.12em] text-ink-soft">
        <EyeOff size={13} aria-hidden="true" className="shrink-0" />
        {m.atsCard.onlyYou}
      </p>
      <div className="flex flex-wrap items-end justify-between gap-6">
        <div>
          <h2 id="ats-summary" className="font-mono text-[12px] font-medium uppercase tracking-[0.14em]">
            <span className="hl">{m.atsCard.title}</span>
          </h2>
          <p className="mt-2 max-w-[38ch] font-sans text-[14px] text-ink-soft">{m.atsCard.lead}</p>
        </div>
        <p className="font-reading leading-none" aria-live="polite">
          <span className="text-[64px] tracking-[-0.04em] tabular-nums md:text-[80px]">{shown}</span>
          <span className="font-mono text-[14px] text-ink-soft">/100 · {label}</span>
        </p>
      </div>

      {/* 20-step meter: ink up to the score, rule after it */}
      <div className="mt-5 grid grid-cols-[repeat(20,minmax(0,1fr))] gap-[3px]" aria-hidden="true">
        {Array.from({ length: steps }, (_, i) => (
          <span key={i} className={`bar-grow h-2.5 ${i < filled ? 'bg-ink' : 'bg-rule'}`} style={{ transitionDelay: `${200 + i * 25}ms` }} />
        ))}
      </div>

      {top.length > 0 ? (
        <div className="mt-6">
          <h3 className="font-mono text-[11px] uppercase tracking-[0.14em] text-ink-soft">{m.atsCard.topFixes}</h3>
          <ul className="mt-3 flex flex-wrap gap-2">
            {top.map((f) => (
              <li key={f.id}>
                <button
                  type="button"
                  onClick={() => onOpen(f.section)}
                  className="group inline-flex max-w-full items-start gap-2 rounded-full border border-ink px-3.5 py-1.5 text-left font-sans text-[13px] leading-snug hover:bg-highlight hover:text-[#111]"
                >
                  {f.severity === 'error' && <span className="mt-1.5 h-2 w-2 shrink-0 rounded-full bg-signal" aria-hidden="true" />}
                  <span className="sr-only">{m.ats.severity[f.severity]}: </span>
                  <span>{fmt(m.ats.findings[f.key], { ...f.params, label: (f.params?.label as string) || m.ats.untitledRole })}</span>
                  <Plus size={14} aria-hidden="true" className="mt-0.5 shrink-0 transition-transform group-hover:rotate-90 motion-reduce:transition-none" />
                </button>
              </li>
            ))}
          </ul>
        </div>
      ) : (
        <p className="mt-6 font-sans text-[14px]"><span className="hl">{m.atsCard.allGood}</span></p>
      )}

      <div className="mt-6 flex flex-wrap items-center gap-x-6 gap-y-3">
        <button type="button" onClick={onJobAd} className="nudge inline-flex h-9 items-center gap-2 rounded-sm border border-ink px-3 font-sans text-[14px] font-medium hover:bg-ink hover:text-paper">
          <ClipboardPaste size={15} aria-hidden="true" />
          {targetTitle ? <>{m.app.jobAdShort}: {targetTitle}</> : m.app.jobAd}
        </button>
        <button type="button" onClick={() => onOpen()} className="nudge inline-flex items-center gap-1.5 font-sans text-[14px] underline decoration-1 underline-offset-[6px]">
          {m.atsCard.open}
          <ArrowRight size={15} aria-hidden="true" />
        </button>
      </div>
    </section>
  );
}
