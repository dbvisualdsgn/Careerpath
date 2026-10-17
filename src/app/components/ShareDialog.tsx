import { useEffect, useId, useRef, useState } from 'react';
import { Check, Copy, ExternalLink, Info, Link2, Loader2, Lock, RefreshCw, Share2 } from 'lucide-react';
import { toast } from 'sonner';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from './ui/dialog';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { createShareLink, shareBaseUrl, type ShareLink } from '../cv/share';
import { useI18n } from '../i18n';
import type { CVData } from '../cv/types';

interface ShareDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  cv: CVData;
  /** Private CVs cannot be shared; the dialog offers to switch to public instead. */
  isPublic: boolean;
  onMakePublic?: () => void;
}

export function ShareDialog({ open, onOpenChange, cv, isPublic, onMakePublic }: ShareDialogProps) {
  const { m } = useI18n();
  const s = m.share;
  const inputId = useId();
  const inputRef = useRef<HTMLInputElement>(null);
  const [link, setLink] = useState<ShareLink | null>(null);
  const [busy, setBusy] = useState(false);
  const [copied, setCopied] = useState(false);
  const [manualHint, setManualHint] = useState(false);

  const generate = async () => {
    setBusy(true);
    setCopied(false);
    setManualHint(false);
    try {
      setLink(await createShareLink(cv, shareBaseUrl()));
    } catch {
      setLink(null);
      toast.error(s.error);
    } finally {
      setBusy(false);
    }
  };

  // A fresh link for the CV as it is now, every time the dialog opens.
  useEffect(() => {
    if (open && isPublic) generate();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, isPublic]);

  const copy = async () => {
    if (!link) return;
    try {
      await navigator.clipboard.writeText(link.url);
      setCopied(true);
      toast.success(s.copied);
    } catch {
      // Clipboard blocked (e.g. sandboxed preview): select the text so the user can copy it by hand.
      inputRef.current?.focus();
      inputRef.current?.select();
      setManualHint(true);
    }
  };

  const nativeShare = async () => {
    if (!link) return;
    try {
      await navigator.share({ title: `${cv.profile.name} - ${m.app.cvTitle}`, text: `${cv.profile.name} - ${cv.profile.headline}`, url: link.url });
    } catch {
      // Dismissed or not allowed here: the copy button still works.
    }
  };

  const canNativeShare = typeof navigator !== 'undefined' && typeof navigator.share === 'function';

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>{s.title}</DialogTitle>
          <DialogDescription className="text-zinc-600 dark:text-zinc-400">{s.description}</DialogDescription>
        </DialogHeader>

        {!isPublic ? (
          <div className="space-y-4">
            <p className="flex gap-2 text-sm"><Lock size={20} aria-hidden="true" className="mt-0.5 shrink-0" />{m.privacy.shareOff}</p>
            {onMakePublic && (
              <Button type="button" onClick={onMakePublic} className="gap-2">
                <Link2 size={20} aria-hidden="true" /> {m.privacy.makePublic}
              </Button>
            )}
            <p className="text-xs text-ink-soft">{m.privacy.note}</p>
          </div>
        ) : (<>
        <div className="space-y-2">
          <Label htmlFor={inputId} className="text-xs text-zinc-700 dark:text-zinc-300">{s.linkLabel}</Label>
          <div className="flex gap-2">
            <Input
              id={inputId}
              ref={inputRef}
              readOnly
              value={busy ? s.creating : link?.url ?? ''}
              onFocus={(e) => e.currentTarget.select()}
              className="font-mono text-xs"
              aria-describedby={manualHint ? `${inputId}-hint` : undefined}
            />
            <Button type="button" onClick={copy} disabled={busy || !link} className="shrink-0 gap-1.5">
              {copied ? <Check size={20} aria-hidden="true" /> : <Copy size={20} aria-hidden="true" />}
              {copied ? s.copied : s.copy}
            </Button>
          </div>
          <p id={`${inputId}-hint`} role="status" className="min-h-4 text-xs text-zinc-700 dark:text-zinc-300">
            {manualHint ? s.copyManual : ''}
          </p>
        </div>

        <div className="flex flex-wrap gap-2">
          {canNativeShare && (
            <Button type="button" variant="outline" size="sm" className="gap-1.5" onClick={nativeShare} disabled={busy || !link}>
              <Share2 size={20} aria-hidden="true" /> {s.nativeShare}
            </Button>
          )}
          <Button type="button" variant="outline" size="sm" className="gap-1.5" asChild disabled={busy || !link}>
            <a href={link?.url ?? '#'} target="_blank" rel="noopener noreferrer">
              <ExternalLink size={20} aria-hidden="true" /> {s.open}
            </a>
          </Button>
          <Button type="button" variant="ghost" size="sm" className="gap-1.5" onClick={generate} disabled={busy}>
            {busy ? <Loader2 size={20} className="animate-spin motion-reduce:animate-none" aria-hidden="true" /> : <RefreshCw size={20} aria-hidden="true" />}
            {s.newLink}
          </Button>
        </div>

        <p className="text-xs text-ink-soft">{m.privacy.note}</p>
        </>)}

        {isPublic && link?.droppedLogos && (
          <p className="flex gap-2 rounded-md bg-zinc-50 p-3 text-xs text-zinc-700">
            <Info size={20} className="mt-0.5 shrink-0" aria-hidden="true" />{s.logosDropped}
          </p>
        )}
      </DialogContent>
    </Dialog>
  );
}
