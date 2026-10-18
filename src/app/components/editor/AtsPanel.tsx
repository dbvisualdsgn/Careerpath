import { useEffect, useId, useMemo, useRef, useState } from 'react';
import { AlertCircle, AlertTriangle, Check, CheckCircle2, Lightbulb, Plus, RotateCw } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '../ui/button';
import { Textarea } from '../ui/textarea';
import { Input } from '../ui/input';
import { Progress } from '../ui/progress';
import { matchKeywords, runAtsCheck, titleMatch, type Finding } from '../../cv/atsCheck';
import { setJobAdText, setJobAdTitle, useJobAd } from '../../cv/jobAd';
import { fmt, useI18n } from '../../i18n';
import type { CVData } from '../../cv/types';

const severityStyle: Record<Finding['severity'], { icon: typeof AlertCircle; className: string }> = {
  error: { icon: AlertCircle, className: 'text-signal' },
  warning: { icon: AlertTriangle, className: 'text-ink' },
  tip: { icon: Lightbulb, className: 'text-ink-soft' },
};

const headingClass = 'text-xs font-semibold uppercase tracking-wider text-zinc-600 dark:text-zinc-400 mb-2';

interface AtsPanelProps {
  cv: CVData;
  onJump: (section: Finding['section']) => void;
  onAddSkill: (skill: string) => void;
  onSetHeadline: (headline: string) => void;
  /** Bumped when the person asks to paste a job ad: focus the box. */
  focusJobAd?: number;
}

// The last focus request handled, so switching back to this tab doesn't steal focus again.
let handledFocus = 0;

export function AtsPanel({ cv, onJump, onAddSkill, onSetHeadline, focusJobAd = 0 }: AtsPanelProps) {
  const { m, locale } = useI18n();
  const jdId = useId();
  const titleId = useId();
  const titleStatusId = useId();
  const { text: jd, title, hasAd } = useJobAd();
  const jdRef = useRef<HTMLTextAreaElement>(null);
  useEffect(() => {
    if (focusJobAd > handledFocus) {
      handledFocus = focusJobAd;
      jdRef.current?.focus();
      jdRef.current?.scrollIntoView({ block: 'center' });
    }
  }, [focusJobAd]);
  // Bumped by the refresh button to force a fresh run (the check also re-runs on every edit).
  const [runId, setRunId] = useState(0);
  const [spinning, setSpinning] = useState(false);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  const report = useMemo(() => runAtsCheck(cv, locale, { targetTitle: title }), [cv, locale, title, runId]);
  const [checkedAt, setCheckedAt] = useState(() => new Date());
  const timeLabel = checkedAt.toLocaleTimeString(locale, { hour: '2-digit', minute: '2-digit', second: '2-digit' });

  const refresh = () => {
    // Commit a field that is still being edited (e.g. skills save on blur) before re-checking.
    if (document.activeElement instanceof HTMLElement) document.activeElement.blur();
    setSpinning(true);
    // Wait a tick so the blur's state update lands before the new run.
    setTimeout(() => {
      setRunId((n) => n + 1);
      setCheckedAt(new Date());
      setSpinning(false);
      toast.success(m.ats.refreshed);
    }, 350);
  };
  const match = useMemo(() => (hasAd ? matchKeywords(cv, jd, locale) : null), [cv, jd, hasAd, locale]);
  const fit = title.trim() ? titleMatch(cv, title) : null;

  const scoreLabel = report.score >= 85 ? m.ats.strong : report.score >= 65 ? m.ats.good : m.ats.needsWork;
  // The fixes worth the most points come first.
  const findings = [...report.findings].sort((a, b) => b.weight - a.weight);
  const message = (f: Finding) =>
    fmt(m.ats.findings[f.key], { ...f.params, label: (f.params?.label as string) || m.ats.untitledRole });

  return (
    <div className="space-y-6">
      <div className="on-ink p-4">
        <div className="flex items-baseline justify-between">
          <h3 className="text-sm font-medium"><span className="hl">{m.ats.readiness}</span></h3>
          <p className="font-title text-5xl tabular-nums tracking-[-0.03em]">
            {report.score}
            <span className="text-sm text-zinc-600 dark:text-zinc-400">/100</span>
          </p>
        </div>
        <Progress value={report.score} className="mt-2" aria-label={m.ats.readiness} />
        <p className="mt-2 text-xs text-zinc-600 dark:text-zinc-400" aria-live="polite">
          {fmt(m.ats.summaryLine, { label: scoreLabel, words: report.wordCount, count: report.findings.length })}
        </p>
        <div className="mt-3 flex items-center justify-between gap-3 border-t border-zinc-200 dark:border-zinc-800 pt-3">
          <p className="text-[11px] text-zinc-600 dark:text-zinc-400">{fmt(m.ats.lastChecked, { time: timeLabel })}</p>
          <Button type="button" variant="outline" size="sm" className="h-8 gap-1.5 text-xs" onClick={refresh} disabled={spinning}>
            <RotateCw size={20} aria-hidden="true" className={spinning ? 'animate-spin motion-reduce:animate-none' : ''} />
            {m.ats.refresh}
          </Button>
        </div>
      </div>

      <section>
        <h3 className={headingClass}>
          <label htmlFor={jdId}>{m.ats.jdTitle}</label>
        </h3>
        <Textarea
          ref={jdRef}
          id={jdId}
          value={jd}
          onChange={(e) => setJobAdText(e.target.value)}
          placeholder={m.ats.jdPlaceholder}
          className="min-h-28 text-sm"
        />
        {hasAd && (
          <div className="mt-4 border border-ink p-3">
            <label htmlFor={titleId} className="font-mono text-[11px] uppercase tracking-[0.12em] text-ink-soft">{m.ats.titleLabel}</label>
            <Input
              id={titleId}
              value={title}
              onChange={(e) => setJobAdTitle(e.target.value)}
              aria-describedby={titleStatusId}
              className="mt-1.5 font-medium"
            />
            <div id={titleStatusId} className="mt-2 flex flex-wrap items-center justify-between gap-2" aria-live="polite">
              {fit && (
                <p className="flex items-start gap-1.5 text-sm">
                  {fit === 'headline' ? (
                    <CheckCircle2 size={20} className="mt-0.5 shrink-0 text-go" aria-hidden="true" />
                  ) : (
                    <AlertCircle size={20} className={`mt-0.5 shrink-0 ${fit === 'none' ? 'text-signal' : 'text-ink'}`} aria-hidden="true" />
                  )}
                  {fit === 'headline' ? m.ats.titleIsHeadline : fit === 'past' ? m.ats.titleIsPast : m.ats.titleIsNone}
                </p>
              )}
              <p className="text-xs text-ink-soft">{m.ats.titleHint}</p>
            </div>
            {fit && fit !== 'headline' && (
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="mt-2 h-8 text-xs"
                onClick={() => {
                  onSetHeadline(title.trim());
                  toast.success(m.ats.headlineSet);
                }}
              >
                {m.ats.useAsHeadline}
              </Button>
            )}
          </div>
        )}
        {match && (
          <div className="mt-3 space-y-3" aria-live="polite">
            <p className="text-sm">
              <strong className="tabular-nums">{fmt(m.ats.matchLine, { rate: match.rate, matched: match.matched.length, total: match.keywords.length })}</strong>{' '}
              <span className="text-zinc-600 dark:text-zinc-400">{m.ats.matchHint}</span>
            </p>
            {match.missing.length > 0 && (
              <div>
                <h4 className="sr-only">{m.ats.missingKeywords}</h4>
                <ul className="flex flex-wrap gap-1.5">
                  {match.missing.map((k) => (
                    <li key={k}>
                      <button
                        type="button"
                        onClick={() => {
                          onAddSkill(k);
                          toast.success(m.atsCard.added);
                        }}
                        aria-label={fmt(m.atsCard.addKeyword, { k })}
                        title={fmt(m.atsCard.addKeyword, { k })}
                        className="group inline-flex items-center gap-1 rounded-full border border-ink px-2.5 py-1 text-[13px] text-ink hover:bg-highlight hover:text-[#111]"
                      >
                        {k}
                        <Plus size={20} aria-hidden="true" className="transition-transform group-hover:rotate-90 motion-reduce:transition-none" />
                      </button>
                    </li>
                  ))}
                </ul>
              </div>
            )}
            {match.matched.length > 0 && (
              <div>
                <h4 className="sr-only">{m.ats.matchedKeywords}</h4>
                <ul className="flex flex-wrap gap-1.5">
                  {match.matched.map((k) => (
                    <li key={k} className="inline-flex items-center gap-1 rounded-full border border-ink bg-highlight px-2.5 py-1 font-body text-[13px] italic text-[#111]">
                      {k}
                      <Check size={20} aria-hidden="true" />
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        )}
      </section>

      <section>
        <h3 className={headingClass}>{m.ats.suggestions}</h3>
        {findings.length === 0 && <p className="text-sm text-zinc-600 dark:text-zinc-400">{m.ats.noIssues}</p>}
        <ul className="space-y-1.5">
          {findings.map((f) => {
            const s = severityStyle[f.severity];
            return (
              <li key={f.id}>
                <button
                  type="button"
                  onClick={() => onJump(f.section)}
                  className="flex w-full gap-2 rounded-md p-2 text-left text-sm hover:bg-zinc-100 focus-visible:outline-2 focus-visible:outline-[var(--focus)] dark:hover:bg-zinc-800/60"
                >
                  <s.icon size={20} className={`mt-0.5 shrink-0 ${s.className}`} aria-hidden="true" />
                  <span className="flex-1">
                    <span className="sr-only">{m.ats.severity[f.severity]}: </span>
                    {message(f)}
                  </span>
                  {f.weight > 0 && (
                    <span className="shrink-0 font-mono text-[11px] tabular-nums text-ink-soft">
                      <span aria-hidden="true">−{f.weight}</span>
                      <span className="sr-only">({fmt(m.ats.costSr, { n: f.weight })})</span>
                    </span>
                  )}
                </button>
              </li>
            );
          })}
        </ul>
        {locale !== 'en' && <p className="mt-2 text-xs text-zinc-600 dark:text-zinc-400">{m.ats.englishOnly}</p>}
      </section>

      {report.passed.length > 0 && (
        <section>
          <h3 className={headingClass}>{m.ats.passing}</h3>
          <ul className="space-y-1">
            {report.passed.map((p) => (
              <li key={p.key} className="flex gap-2 text-sm text-zinc-700 dark:text-zinc-300">
                <CheckCircle2 size={20} className="mt-0.5 shrink-0 text-go" aria-hidden="true" />
                {fmt(m.ats.passed[p.key], p.params)}
              </li>
            ))}
          </ul>
        </section>
      )}


      <div className="rounded-lg bg-zinc-50 dark:bg-zinc-900 p-4 text-xs text-zinc-700 dark:text-zinc-300 space-y-1.5">
        <p className="font-semibold text-zinc-900 dark:text-zinc-100">{m.ats.builtInTitle}</p>
        <p>{m.ats.builtIn1}</p>
        <p>{m.ats.builtIn2}</p>
      </div>
    </div>
  );
}
