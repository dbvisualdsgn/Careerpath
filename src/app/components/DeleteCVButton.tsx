import { Trash2 } from 'lucide-react';
import { toast } from 'sonner';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from './ui/alert-dialog';
import { fmt, useI18n } from '../i18n';

/** Bin button in the CV menu: asks first, then deletes the open CV from this browser. */
export function DeleteCVButton({ name, onDelete, className }: { name: string; onDelete: () => Promise<boolean>; className: string }) {
  const { m } = useI18n();
  return (
    <AlertDialog>
      <AlertDialogTrigger asChild>
        <button type="button" aria-label={m.library.delete} title={m.library.delete} className={className}>
          <Trash2 size={20} aria-hidden="true" />
        </button>
      </AlertDialogTrigger>
      <AlertDialogContent className="rounded-sm border-ink bg-paper text-ink">
        <AlertDialogHeader>
          <AlertDialogTitle className="font-title text-2xl font-normal">{fmt(m.library.deleteTitle, { name: name || m.library.untitled })}</AlertDialogTitle>
          <AlertDialogDescription className="text-ink-soft">{m.library.deleteBody}</AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel className="rounded-sm">{m.library.cancel}</AlertDialogCancel>
          <AlertDialogAction
            className="gap-1.5 rounded-sm"
            onClick={async () => {
              if (await onDelete()) toast.success(m.library.deleted);
            }}
          >
            <Trash2 size={20} aria-hidden="true" /> {m.library.deleteConfirm}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
