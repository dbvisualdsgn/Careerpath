import { useId, useState } from 'react';
import { CopyPlus } from 'lucide-react';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '../ui/dialog';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { useI18n } from '../../i18n';

/** "Save as a new version…": names a copy of the open CV so tailoring for one job never overwrites another. */
export function SaveVersionDialog({ onSave }: { onSave: (name: string) => void }) {
  const { m } = useI18n();
  const l = m.library;
  const [open, setOpen] = useState(false);
  const [name, setName] = useState('');
  const id = useId();
  const submit = (ev: React.FormEvent) => {
    ev.preventDefault();
    onSave(name.trim());
    setName('');
    setOpen(false);
  };
  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm" className="col-span-2 gap-1.5 text-xs">
          <CopyPlus size={14} aria-hidden="true" /> {l.saveVersion}
        </Button>
      </DialogTrigger>
      <DialogContent className="rounded-sm border-ink bg-paper text-ink">
        <form onSubmit={submit} className="space-y-5">
          <DialogHeader>
            <DialogTitle className="font-reading text-2xl font-normal">{l.versionTitle}</DialogTitle>
            <DialogDescription className="text-ink-soft">{l.versionBody}</DialogDescription>
          </DialogHeader>
          <div className="space-y-1.5">
            <label htmlFor={id} className="text-xs font-medium">{l.versionName}</label>
            <Input id={id} value={name} onChange={(e) => setName(e.target.value)} placeholder={l.versionPlaceholder} aria-describedby={`${id}-hint`} autoFocus />
            <p id={`${id}-hint`} className="text-xs text-ink-soft">{l.versionHint}</p>
          </div>
          <DialogFooter>
            <Button type="submit" className="gap-1.5 rounded-sm">
              <CopyPlus size={14} aria-hidden="true" /> {l.versionSave}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
