import { useMemo } from 'react';
import { AlertCircle, AlertTriangle, CheckCircle2, Lightbulb } from 'lucide-react';
import { runAtsCheck, type Finding } from '../../cv/atsCheck';
import { useJobAd } from '../../cv/jobAd';
import { fmt, useI18n } from '../../i18n';
import type { CVData } from '../../cv/types';

const severityStyle: Record<Finding['severity'], { icon: typeof AlertCircle; className: string }> = {
  error: { icon: AlertCircle, className: 'text-signal' },
  warning: { icon: AlertTriangle, className: 'text-ink' },
  tip: { icon: Lightbulb, className: 'text-ink-soft' },
};

const headingClass = 'text-xs font-semibold uppercase tracking-wider text-zinc-600 mb-2';

interface AtsPanelProps {
  cv: CVData;
  onJump: (section: Finding['section']) => void;
}

/** The full recruiter check: every fix with the points it adds, then what already passes. */
export function AtsPanel({ cv, onJump }: AtsPanelProps) {
  const { m, locale } = useI18n();
  const { title } = useJobAd();
  const report = useMemo(() => runAtsCheck(cv, locale, { targetTitle: title }), [cv, locale, title]);

  // The fixes worth the most points come first.
  const findings = [...report.findings].sort((a, b) => b.weight - a.weight);
  const message = (f: Finding) =>
    fmt(m.ats.findings[f.key], { ...f.params, label: (f.params?.label as string) || m.ats.untitledRole });

  return (
    <div className="space-y-6">
      <section>
        <h3 className={headingClass}>{m.ats.suggestions}</h3>
        {findings.length === 0 && <p className="text-sm text-zinc-600">{m.ats.noIssues}</p>}
        <ul className="space-y-1.5">
          {findings.map((f) => {
            const s = severityStyle[f.severity];
            return (
              <li key={f.id}>
                <button
                  type="button"
                  onClick={() => onJump(f.section)}
                  className="flex w-full gap-2 rounded-md p-2 text-left text-sm hover:bg-zinc-100 focus-visible:outline-2 focus-visible:outline-[var(--focus)]"
                >
                  <s.icon size={20} className={`mt-0.5 shrink-0 ${s.className}`} aria-hidden="true" />
                  <span className="flex-1">
                    <span className="sr-only">{m.ats.severity[f.severity]}: </span>
                    {message(f)}
                  </span>
                  {f.weight > 0 && (
                    <span className="shrink-0 font-mono text-[11px] tabular-nums text-ink-soft">
                      <span aria-hidden="true">+{f.weight}</span>
                      <span className="sr-only">({fmt(m.ats.costSr, { n: f.weight })})</span>
                    </span>
                  )}
                </button>
              </li>
            );
          })}
        </ul>
        {locale !== 'en' && <p className="mt-2 text-xs text-zinc-600">{m.ats.englishOnly}</p>}
      </section>

      {report.passed.length > 0 && (
        <section>
          <h3 className={headingClass}>{m.ats.passing}</h3>
          <ul className="space-y-1">
            {report.passed.map((p) => (
              <li key={p.key} className="flex gap-2 text-sm text-zinc-700">
                <CheckCircle2 size={20} className="mt-0.5 shrink-0 text-go" aria-hidden="true" />
                {fmt(m.ats.passed[p.key], p.params)}
              </li>
            ))}
          </ul>
        </section>
      )}


      <div className="rounded-lg bg-zinc-50 p-4 text-xs text-zinc-700 space-y-1.5">
        <p className="font-semibold text-zinc-900">{m.ats.builtInTitle}</p>
        <p>{m.ats.builtIn1}</p>
        <p>{m.ats.builtIn2}</p>
      </div>
    </div>
  );
}
