import { useMemo, useState } from 'react';
import { AlertCircle, AlertTriangle, CheckCircle2, Lightbulb } from 'lucide-react';
import { Textarea } from '../ui/textarea';
import { Progress } from '../ui/progress';
import { matchKeywords, runAtsCheck, type Finding } from '../../cv/atsCheck';
import type { CVData } from '../../cv/types';

const severityStyle: Record<Finding['severity'], { icon: typeof AlertCircle; className: string; label: string }> = {
  error: { icon: AlertCircle, className: 'text-red-600 dark:text-red-400', label: 'Fix' },
  warning: { icon: AlertTriangle, className: 'text-amber-600 dark:text-amber-400', label: 'Improve' },
  tip: { icon: Lightbulb, className: 'text-blue-600 dark:text-blue-400', label: 'Tip' },
};

const JD_KEY = 'careerpath.jd.v1';

export function AtsPanel({ cv, onJump }: { cv: CVData; onJump: (section: Finding['section']) => void }) {
  const report = useMemo(() => runAtsCheck(cv), [cv]);
  const [jd, setJd] = useState(() => {
    try {
      return localStorage.getItem(JD_KEY) ?? '';
    } catch {
      return '';
    }
  });
  const match = useMemo(() => (jd.trim() ? matchKeywords(cv, jd) : null), [cv, jd]);

  const scoreLabel = report.score >= 85 ? 'Strong' : report.score >= 65 ? 'Good, can improve' : 'Needs work';
  const order = { error: 0, warning: 1, tip: 2 };
  const findings = [...report.findings].sort((a, b) => order[a.severity] - order[b.severity]);

  return (
    <div className="space-y-6">
      <div className="rounded-lg border border-zinc-200 dark:border-zinc-800 p-4">
        <div className="flex items-baseline justify-between">
          <span className="text-sm font-medium">ATS readiness</span>
          <span className="text-2xl font-bold tabular-nums">{report.score}<span className="text-sm text-zinc-400">/100</span></span>
        </div>
        <Progress value={report.score} className="mt-2" />
        <p className="mt-2 text-xs text-zinc-500">
          {scoreLabel} · {report.wordCount} words · {report.findings.length} suggestions
        </p>
      </div>

      <div>
        <h4 className="text-xs font-semibold uppercase tracking-wider text-zinc-500 mb-2">Suggestions</h4>
        {findings.length === 0 && <p className="text-sm text-zinc-500">No issues found. Nice work.</p>}
        <ul className="space-y-1.5">
          {findings.map((f) => {
            const s = severityStyle[f.severity];
            return (
              <li key={f.id}>
                <button
                  type="button"
                  onClick={() => onJump(f.section)}
                  className="flex w-full gap-2 rounded-md p-2 text-left text-sm hover:bg-zinc-100 dark:hover:bg-zinc-800/60"
                >
                  <s.icon size={16} className={`mt-0.5 shrink-0 ${s.className}`} aria-label={s.label} />
                  <span>{f.message}</span>
                </button>
              </li>
            );
          })}
        </ul>
      </div>

      {report.passed.length > 0 && (
        <div>
          <h4 className="text-xs font-semibold uppercase tracking-wider text-zinc-500 mb-2">Passing</h4>
          <ul className="space-y-1">
            {report.passed.map((p) => (
              <li key={p} className="flex gap-2 text-sm text-zinc-600 dark:text-zinc-400">
                <CheckCircle2 size={16} className="mt-0.5 shrink-0 text-emerald-600 dark:text-emerald-400" />
                {p}
              </li>
            ))}
          </ul>
        </div>
      )}

      <div>
        <h4 className="text-xs font-semibold uppercase tracking-wider text-zinc-500 mb-2">Job description match</h4>
        <Textarea
          value={jd}
          onChange={(e) => {
            setJd(e.target.value);
            try {
              localStorage.setItem(JD_KEY, e.target.value);
            } catch {
              // Not critical.
            }
          }}
          placeholder="Paste a job description to see which keywords your CV is missing."
          className="min-h-28 text-sm"
        />
        {match && (
          <div className="mt-3 space-y-3">
            <p className="text-sm">
              <strong className="tabular-nums">{match.rate}%</strong> keyword match ({match.matched.length}/{match.keywords.length}).{' '}
              <span className="text-zinc-500">Aim for 70%+ using the job's exact wording, where it is true for you.</span>
            </p>
            {match.missing.length > 0 && (
              <div className="flex flex-wrap gap-1.5">
                {match.missing.map((k) => (
                  <span key={k} className="rounded border border-amber-300 bg-amber-50 px-1.5 py-0.5 text-xs text-amber-900 dark:border-amber-800 dark:bg-amber-950/40 dark:text-amber-200">
                    {k}
                  </span>
                ))}
              </div>
            )}
            {match.matched.length > 0 && (
              <div className="flex flex-wrap gap-1.5">
                {match.matched.map((k) => (
                  <span key={k} className="rounded border border-emerald-300 bg-emerald-50 px-1.5 py-0.5 text-xs text-emerald-900 dark:border-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-200">
                    {k}
                  </span>
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      <div className="rounded-lg bg-zinc-50 dark:bg-zinc-900 p-4 text-xs text-zinc-600 dark:text-zinc-400 space-y-1.5">
        <p className="font-semibold text-zinc-900 dark:text-zinc-100">Built in for ATS and AI screeners</p>
        <p>"Download PDF" prints a single-column, text-only layout with standard headings. It has no icons, tables or columns that parsers misread.</p>
        <p>The page includes schema.org data, and "Copy as text" gives a clean version to paste into application forms.</p>
      </div>
    </div>
  );
}
