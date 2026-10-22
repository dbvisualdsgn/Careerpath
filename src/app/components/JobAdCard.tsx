import { useEffect, useId, useMemo, useRef } from 'react';
import { AlertCircle, Check, CheckCircle2, ClipboardPaste, Plus } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from './ui/button';
import { Textarea } from './ui/textarea';
import { Input } from './ui/input';
import { matchKeywords, titleMatch } from '../cv/atsCheck';
import { setJobAdText, setJobAdTitle, useJobAd } from '../cv/jobAd';
import { fmt, useI18n } from '../i18n';
import type { CVData } from '../cv/types';

interface JobAdCardProps {
  cv: CVData;
  /** The box is open: closed, the card is just its title, a line and the button. */
  open: boolean;
  onOpen: () => void;
  onAddSkill: (skill: string) => void;
  onSetHeadline: (headline: string) => void;
  /** Bumped when the person asks to paste a job ad: focus the box. */
  focusRequest: number;
}

// The last focus request handled, so re-rendering never steals focus again.
let handledFocus = 0;

/** Tailoring to one job ad, in its own frame on the paper, apart from the recruiter check on black. */
export function JobAdCard({ cv, open, onOpen, onAddSkill, onSetHeadline, focusRequest }: JobAdCardProps) {
  const { m, locale } = useI18n();
  const jdId = useId();
  const titleId = useId();
  const titleStatusId = useId();
  const { text: jd, title, hasAd } = useJobAd();
  const jdRef = useRef<HTMLTextAreaElement>(null);
  useEffect(() => {
    if (open && focusRequest > handledFocus) {
      handledFocus = focusRequest;
      jdRef.current?.focus();
      jdRef.current?.scrollIntoView({ block: 'center' });
    }
  }, [open, focusRequest]);
  const match = useMemo(() => (hasAd ? matchKeywords(cv, jd, locale) : null), [cv, jd, hasAd, locale]);
  const fit = title.trim() ? titleMatch(cv, title) : null;
  const expanded = open || hasAd;

  return (
    <section aria-labelledby="job-ad-title" className="mt-4 border border-ink bg-paper p-5 print:hidden md:p-7">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="max-w-[52ch]">
          <h2 id="job-ad-title" className="flex items-center gap-2 font-mono text-[12px] font-medium uppercase tracking-[0.14em]">
            <ClipboardPaste size={20} aria-hidden="true" />
            {m.ats.jdTitle}
          </h2>
          <p className="mt-2 font-sans text-[14px] text-ink-soft">{m.ats.jobAdLead}</p>
        </div>
        {!expanded && (
          <button
            type="button"
            onClick={onOpen}
            className="nudge inline-flex h-11 items-center gap-2 rounded-sm bg-ink px-4 font-sans text-[14px] font-medium text-paper hover:opacity-90 md:h-10"
          >
            <ClipboardPaste size={20} aria-hidden="true" />
            {m.app.jobAd}
          </button>
        )}
      </div>

      {expanded && (
        <div className="mt-5 space-y-4">
          <label htmlFor={jdId} className="sr-only">{m.app.jobAd}</label>
          <Textarea
            ref={jdRef}
            id={jdId}
            value={jd}
            onChange={(e) => setJobAdText(e.target.value)}
            placeholder={m.ats.jdPlaceholder}
            className="min-h-32 text-sm"
          />
          {hasAd && (
            <div className="border-t border-rule pt-4">
              <label htmlFor={titleId} className="font-mono text-[11px] uppercase tracking-[0.12em] text-ink-soft">{m.ats.titleLabel}</label>
              <Input id={titleId} value={title} onChange={(e) => setJobAdTitle(e.target.value)} aria-describedby={titleStatusId} className="mt-1.5 font-medium" />
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
                  className="mt-2 h-9 rounded-sm text-xs"
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
            <div className="space-y-3 border-t border-rule pt-4" aria-live="polite">
              <p className="text-sm">
                <strong className="tabular-nums">{fmt(m.ats.matchLine, { rate: match.rate, matched: match.matched.length, total: match.keywords.length })}</strong>{' '}
                <span className="text-ink-soft">{m.ats.matchHint}</span>
              </p>
              {match.missing.length > 0 && (
                <div>
                  <h3 className="sr-only">{m.ats.missingKeywords}</h3>
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
                          className="group inline-flex min-h-9 items-center gap-1 rounded-full border border-ink px-2.5 py-1 text-[13px] text-ink hover:bg-highlight hover:text-[#111]"
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
                  <h3 className="sr-only">{m.ats.matchedKeywords}</h3>
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
        </div>
      )}
    </section>
  );
}
