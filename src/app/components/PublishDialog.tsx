import { useId, useState } from 'react';
import { Check, Code, Download, ExternalLink, Link2, Loader2, Users } from 'lucide-react';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from './ui/dialog';
import { Button } from './ui/button';
import { useI18n } from '../i18n';

interface PublishDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** Resolves to true once the CV is live. */
  onConfirm: (listed: boolean) => Promise<boolean>;
  busy: boolean;
}

/** Before a CV goes public: what that means, and whether to show it on the Public CVs page too. */
export function PublishDialog({ open, onOpenChange, onConfirm, busy }: PublishDialogProps) {
  const { m } = useI18n();
  const p = m.publish;
  const [listed, setListed] = useState(false);
  const [failed, setFailed] = useState(false);
  const id = useId();
  const points = [
    { icon: Link2, text: p.point1 },
    { icon: ExternalLink, text: p.point2 },
    { icon: Code, text: p.point3 },
    { icon: Download, text: p.point4 },
  ];
  return (
    <Dialog open={open} onOpenChange={(o) => { setFailed(false); onOpenChange(o); }}>
      <DialogContent className="rounded-sm border-ink bg-paper text-ink sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="font-title text-2xl">{p.title}</DialogTitle>
          <DialogDescription className="text-ink-soft">{p.lead}</DialogDescription>
        </DialogHeader>
        <ul className="space-y-2.5 text-[14px]">
          {points.map(({ icon: Icon, text }) => (
            <li key={text} className="flex items-start gap-2.5">
              <Icon size={20} aria-hidden="true" className="shrink-0" />
              <span>{text}</span>
            </li>
          ))}
        </ul>
        <p className="border-l-2 border-ink pl-3 text-[13px] leading-snug text-ink-soft">{p.visible}</p>
        <label htmlFor={id} className="flex cursor-pointer items-start gap-3 border border-rule p-3 has-[:checked]:border-ink">
          <input id={id} type="checkbox" checked={listed} onChange={(e) => setListed(e.target.checked)} className="mt-0.5 h-4 w-4 accent-[var(--ink)]" />
          <span className="text-[14px]">
            <span className="flex items-center gap-1.5 font-medium"><Users size={20} aria-hidden="true" />{p.list}</span>
            <span className="mt-0.5 block text-[13px] text-ink-soft">{p.listHint}</span>
          </span>
        </label>
        {failed && <p role="alert" className="text-[13px] text-signal">{p.failed}</p>}
        <DialogFooter className="gap-2">
          <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>{p.cancel}</Button>
          <Button
            type="button"
            disabled={busy}
            onClick={async () => {
              setFailed(false);
              const ok = await onConfirm(listed);
              if (ok) onOpenChange(false);
              else setFailed(true);
            }}
            className="gap-1.5"
          >
            {busy ? <Loader2 size={20} aria-hidden="true" className="animate-spin motion-reduce:animate-none" /> : <Check size={20} aria-hidden="true" />}
            {p.confirm}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
