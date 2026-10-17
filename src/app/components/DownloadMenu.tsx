import { useState } from 'react';
import { ChevronDown, Download, FileText, Loader2, ScanText } from 'lucide-react';
import { toast } from 'sonner';
import { Popover, PopoverContent, PopoverTrigger } from './ui/popover';
import { buildPdf } from '../cv/pdf';
import { buildDesignedPdf } from '../cv/pdfDesigned';
import { saveFile } from '../cv/save';
import { fileSlug } from '../cv/format';
import { useI18n } from '../i18n';
import type { CVData } from '../cv/types';
import type { TypeStyle } from '../typography';

/** Two downloads: the page as designed, or a plain one-column PDF for job portals. */
export function DownloadMenu({ cv, compact = false, onDownloaded }: { cv: CVData; compact?: boolean; onDownloaded?: () => void }) {
  const { m } = useI18n();
  const d = m.download;
  const [open, setOpen] = useState(false);
  const [busy, setBusy] = useState(false);

  const download = async (kind: 'designed' | 'plain') => {
    setOpen(false);
    setBusy(true);
    try {
      const type = (document.documentElement.dataset.type as TypeStyle) || 'sans';
      const pdf = kind === 'designed' ? await buildDesignedPdf(cv, m, type) : await buildPdf(cv, m);
      const suffix = kind === 'designed' ? 'CV' : 'CV_ATS';
      const outcome = await saveFile(`${fileSlug(cv.profile.name)}_${suffix}.pdf`, pdf, 'application/pdf');
      if (outcome === 'saved') {
        toast.success(m.app.pdfSaved);
        onDownloaded?.();
      }
      else if (outcome === 'failed') toast.error(m.app.pdfError);
    } catch {
      toast.error(m.app.pdfError);
    } finally {
      setBusy(false);
    }
  };

  const option = (kind: 'designed' | 'plain', Icon: typeof FileText, title: string, hint: string) => (
    <button
      type="button"
      onClick={() => download(kind)}
      className="flex w-full gap-3 border-b border-rule px-4 py-3 text-left last:border-b-0 hover:bg-zinc-100 dark:hover:bg-zinc-800"
    >
      <Icon size={20} aria-hidden="true" className="mt-0.5 shrink-0" />
      <span>
        <span className="block text-[14px] font-medium">{title}</span>
        <span className="block text-[12px] leading-snug text-ink-soft">{hint}</span>
      </span>
    </button>
  );

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <button
          type="button"
          disabled={busy}
          aria-busy={busy}
          aria-label={d.title}
          className="inline-flex h-9 items-center gap-2 rounded-sm border border-ink px-1.5 text-[13px] text-ink hover:bg-ink hover:text-paper disabled:opacity-60 lg:px-3"
        >
          {busy ? <Loader2 size={20} className="animate-spin motion-reduce:animate-none" aria-hidden="true" /> : <Download size={20} aria-hidden="true" />}
          <span className={compact ? 'hidden' : 'hidden whitespace-nowrap xl:inline'}>{d.title}</span>
          <ChevronDown size={20} aria-hidden="true" />
        </button>
      </PopoverTrigger>
      <PopoverContent align="end" aria-label={d.title} className="w-72 rounded-sm border-ink bg-paper p-0 text-ink">
        {option('designed', FileText, d.designed, d.designedHint)}
        {option('plain', ScanText, d.plain, d.plainHint)}
      </PopoverContent>
    </Popover>
  );
}
