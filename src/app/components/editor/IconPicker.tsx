import { useEffect, useRef, useState } from 'react';
import { Loader2, Search, Upload, X } from 'lucide-react';
import { Popover, PopoverContent, PopoverTrigger } from '../ui/popover';
import { Input } from '../ui/input';
import { Button } from '../ui/button';
import { BrandIcon } from '../BrandIcon';
import { searchIcons, type CatalogIcon } from '../../cv/iconCatalog';
import { fmt, useI18n } from '../../i18n';

interface IconPickerProps {
  value?: string;
  name: string;
  onChange: (icon: string | undefined) => void;
  /** Preview the logo full-frame, as company logos are shown on the CV. */
  fill?: boolean;
}

const MAX_UPLOAD_BYTES = 200 * 1024;

export function IconPicker({ value, name, onChange, fill = false }: IconPickerProps) {
  const { m } = useI18n();
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState(name);
  const [results, setResults] = useState<CatalogIcon[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const fileRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (open) setQuery(name);
  }, [open, name]);

  useEffect(() => {
    if (!open) return;
    let cancelled = false;
    setLoading(true);
    const t = setTimeout(() => {
      searchIcons(query, 30)
        .then((r) => !cancelled && setResults(r))
        .finally(() => !cancelled && setLoading(false));
    }, 150);
    return () => {
      cancelled = true;
      clearTimeout(t);
    };
  }, [query, open]);

  const onUpload = (file: File | undefined) => {
    setError('');
    if (!file) return;
    if (!file.type.startsWith('image/')) return setError(m.picker.invalidType);
    if (file.size > MAX_UPLOAD_BYTES) return setError(m.picker.tooLarge);
    const reader = new FileReader();
    reader.onload = () => {
      onChange(String(reader.result));
      setOpen(false);
    };
    reader.readAsDataURL(file);
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <button
          type="button"
          title={fmt(m.picker.change, { name: name || m.editor.item })}
          aria-label={fmt(m.picker.change, { name: name || m.editor.item })}
          className="flex h-9 w-9 shrink-0 items-center justify-center overflow-hidden rounded-md border border-zinc-200 bg-white hover:border-zinc-400 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600 dark:border-zinc-700"
        >
          <BrandIcon src={value} name={name} size={18} fill={fill} />
        </button>
      </PopoverTrigger>
      <PopoverContent className="w-80 p-3" align="start">
        <div className="relative">
          <Search size={14} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-zinc-400" />
          <Input
            autoFocus
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder={m.picker.search}
            aria-label={m.picker.search}
            className="pl-8 h-9"
          />
        </div>
        <div className="mt-3 grid grid-cols-6 gap-1.5 max-h-56 overflow-y-auto min-h-12" aria-live="polite">
          {loading && results.length === 0 && (
            <div className="col-span-6 flex items-center gap-2 text-xs text-zinc-600 dark:text-zinc-400 py-3">
              <Loader2 size={14} className="animate-spin" aria-hidden="true" /> {m.picker.loading}
            </div>
          )}
          {!loading && query && results.length === 0 && (
            <p className="col-span-6 text-xs text-zinc-600 dark:text-zinc-400 py-3">{m.picker.none}</p>
          )}
          {results.map((icon) => (
            <button
              key={icon.title}
              type="button"
              title={icon.title}
              aria-label={icon.title}
              onClick={() => {
                onChange(icon.dataUrl);
                setOpen(false);
              }}
              className="flex h-11 items-center justify-center rounded-md border border-transparent bg-white hover:border-zinc-300 focus-visible:outline-2 focus-visible:outline-blue-600 dark:hover:border-zinc-500"
            >
              <img src={icon.dataUrl} alt="" className="h-6 w-6 object-contain" />
            </button>
          ))}
        </div>
        <div className="mt-3 flex items-center gap-2 border-t border-zinc-200 dark:border-zinc-800 pt-3">
          <Button type="button" variant="outline" size="sm" className="gap-1.5" onClick={() => fileRef.current?.click()}>
            <Upload size={14} aria-hidden="true" /> {m.picker.upload}
          </Button>
          {value && (
            <Button type="button" variant="ghost" size="sm" className="gap-1.5" onClick={() => onChange(undefined)}>
              <X size={14} aria-hidden="true" /> {m.picker.remove}
            </Button>
          )}
          <input
            ref={fileRef}
            type="file"
            accept="image/*"
            className="hidden"
            tabIndex={-1}
            aria-hidden="true"
            onChange={(e) => {
              onUpload(e.target.files?.[0]);
              e.target.value = '';
            }}
          />
        </div>
        {error && <p role="alert" className="mt-2 text-xs text-red-700 dark:text-red-400">{error}</p>}
        <p className="mt-2 text-[11px] text-zinc-600 dark:text-zinc-400">{m.picker.credit}</p>
      </PopoverContent>
    </Popover>
  );
}
