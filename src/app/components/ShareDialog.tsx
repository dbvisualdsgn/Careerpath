import { useId, useRef, useState } from 'react';
import { Check, Code, Copy, ExternalLink, Link2, Loader2, Lock, Share2, Users } from 'lucide-react';
import { toast } from 'sonner';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from './ui/dialog';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { DownloadMenu } from './DownloadMenu';
import { isBackendReady, publicCVUrl } from '../cv/backend';
import type { PublishStatus } from '../cv/usePublishing';
import { fmt, useI18n } from '../i18n';
import type { CVData } from '../cv/types';

type Props = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  cv: CVData;
} & (
  | { kind: 'viewing'; url: string }
  | {
      kind: 'own';
      isPublic: boolean;
      publicId?: string;
      listed: boolean;
      status: PublishStatus;
      busy: boolean;
      onMakePublic: () => void;
      onSetListed: (listed: boolean) => void;
    }
);

/** A read-only field with a copy button (falls back to selecting the text when the clipboard is blocked). */
function CopyField({ label, value, multiline = false, copyLabel }: { label: string; value: string; multiline?: boolean; copyLabel: string }) {
  const { m } = useI18n();
  const id = useId();
  const ref = useRef<HTMLInputElement & HTMLTextAreaElement>(null);
  const [copied, setCopied] = useState(false);
  const copy = async () => {
    try {
      await navigator.clipboard.writeText(value);
      setCopied(true);
      toast.success(m.share.copied);
      window.setTimeout(() => setCopied(false), 1800);
    } catch {
      ref.current?.focus();
      ref.current?.select();
    }
  };
  const field = 'w-full border border-rule bg-panel px-3 py-2 font-mono text-[12px] text-ink outline-none focus-visible:border-ink';
  return (
    <div className="space-y-1.5">
      <label htmlFor={id} className="text-xs font-medium">{label}</label>
      <div className="flex items-start gap-2">
        {multiline ? (
          <textarea id={id} ref={ref} readOnly rows={3} value={value} onFocus={(e) => e.currentTarget.select()} className={`${field} resize-none`} />
        ) : (
          <Input id={id} ref={ref} readOnly value={value} onFocus={(e) => e.currentTarget.select()} className="font-mono text-xs" />
        )}
        <Button type="button" onClick={copy} className="shrink-0 gap-1.5">
          {copied ? <Check size={20} aria-hidden="true" /> : <Copy size={20} aria-hidden="true" />}
          {copied ? m.share.copied : copyLabel}
        </Button>
      </div>
    </div>
  );
}

export function ShareDialog(props: Props) {
  const { open, onOpenChange, cv } = props;
  const { m } = useI18n();
  const s = m.share;
  const canNativeShare = typeof navigator !== 'undefined' && typeof navigator.share === 'function';
  const nativeShare = (url: string) =>
    navigator.share({ title: `${cv.profile.name} - ${m.app.cvTitle}`, text: `${cv.profile.name} - ${cv.profile.headline}`, url }).catch(() => undefined);

  const linkActions = (url: string) => (
    <div className="flex flex-wrap gap-2">
      <Button type="button" variant="outline" size="sm" className="gap-1.5" asChild>
        <a href={url} target="_blank" rel="noopener noreferrer"><ExternalLink size={20} aria-hidden="true" /> {s.open}</a>
      </Button>
      {canNativeShare && (
        <Button type="button" variant="outline" size="sm" className="gap-1.5" onClick={() => nativeShare(url)}>
          <Share2 size={20} aria-hidden="true" /> {s.nativeShare}
        </Button>
      )}
    </div>
  );

  let body: React.ReactNode;
  if (props.kind === 'viewing') {
    body = (
      <div className="space-y-4">
        <CopyField label={s.linkLabel} value={props.url} copyLabel={s.copy} />
        {linkActions(props.url)}
      </div>
    );
  } else if (!props.isPublic || !props.publicId) {
    body = (
      <div className="space-y-4">
        <p className="flex gap-2 text-sm"><Lock size={20} aria-hidden="true" className="shrink-0" />{s.privateBody}</p>
        <div className="flex flex-wrap items-center gap-2">
          <DownloadMenu cv={cv} />
          {isBackendReady() ? (
            <Button type="button" variant="outline" onClick={props.onMakePublic} className="gap-2">
              <Link2 size={20} aria-hidden="true" /> {m.privacy.makePublic}
            </Button>
          ) : (
            <p className="text-xs text-ink-soft">{s.notSetUp}</p>
          )}
        </div>
      </div>
    );
  } else {
    const url = publicCVUrl(props.publicId);
    const embed = `<iframe src="${publicCVUrl(props.publicId, true)}" title="${fmt(s.embedTitle, { name: cv.profile.name || m.library.untitled }).replace(/"/g, '&quot;')}" loading="lazy" style="width:100%;height:900px;border:0"></iframe>`;
    body = (
      <div className="space-y-5">
        <p className="flex items-center gap-2 text-[13px]" role="status">
          {props.status === 'saving' ? (
            <><Loader2 size={20} aria-hidden="true" className="animate-spin motion-reduce:animate-none" />{s.saving}</>
          ) : props.status === 'error' ? (
            <><span aria-hidden="true" className="h-2.5 w-2.5 shrink-0 rounded-full bg-signal" />{s.syncError}</>
          ) : (
            <><span aria-hidden="true" className="h-2.5 w-2.5 rounded-full bg-ink" />{s.live}</>
          )}
        </p>
        <CopyField label={s.linkLabel} value={url} copyLabel={s.copy} />
        {linkActions(url)}
        <div className="border-t border-rule pt-4">
          <p className="mb-2 flex items-center gap-1.5 text-xs font-medium"><Code size={20} aria-hidden="true" />{s.embedLabel}</p>
          <CopyField label={s.embedField} value={embed} multiline copyLabel={s.copyEmbed} />
        </div>
        <label className="flex cursor-pointer items-start gap-3 border border-rule p-3 has-[:checked]:border-ink">
          <input
            type="checkbox"
            checked={props.listed}
            disabled={props.busy}
            onChange={(e) => props.onSetListed(e.target.checked)}
            className="mt-0.5 h-4 w-4 accent-[var(--ink)]"
          />
          <span className="text-[14px]">
            <span className="flex items-center gap-1.5 font-medium"><Users size={20} aria-hidden="true" />{m.publish.list}</span>
            <span className="mt-0.5 block text-[13px] text-ink-soft">{m.publish.listHint}</span>
          </span>
        </label>
        <div className="flex flex-wrap items-center justify-between gap-3 border-t border-rule pt-4">
          <DownloadMenu cv={cv} />
          <p className="max-w-[30ch] text-xs text-ink-soft">{s.privateAnyTime}</p>
        </div>
      </div>
    );
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="rounded-sm border-ink bg-paper text-ink sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="font-title text-2xl">{s.title}</DialogTitle>
          <DialogDescription className="text-ink-soft">{props.kind === 'viewing' ? s.viewingDescription : props.isPublic && props.publicId ? s.description : s.privateDescription}</DialogDescription>
        </DialogHeader>
        {body}
      </DialogContent>
    </Dialog>
  );
}
