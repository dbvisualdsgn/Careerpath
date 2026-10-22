import { useId } from 'react';
import { Sun, Thermometer } from 'lucide-react';
import { Popover, PopoverContent, PopoverTrigger } from './ui/popover';
import { defaultPaper, paperColors, usePaper } from '../paper';
import { fmt, useI18n } from '../i18n';

/** Kobo-style light panel: brightness and warmth sliders, with the live text contrast. */
export function PaperControls() {
  const { m } = useI18n();
  const p = m.paper;
  const [settings, setSettings] = usePaper();
  const { inkRatio, softRatio, paper } = paperColors(settings);
  const bId = useId();
  const wId = useId();
  const minRatio = Math.min(inkRatio, softRatio);

  const slider = (id: string, value: number, onChange: (v: number) => void, label: string, low: string, high: string, icon: React.ReactNode, track: string) => (
    <div className="px-4 py-4">
      <div className="flex items-center justify-between">
        <label htmlFor={id} className="flex items-center gap-2 text-[14px] font-medium">
          {icon}
          {label}
        </label>
        <span className="font-mono text-[12px] text-ink-soft tabular-nums" aria-hidden="true">{value}</span>
      </div>
      <input
        id={id}
        type="range"
        min={0}
        max={100}
        step={1}
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        aria-valuetext={`${value}% · ${value < 50 ? low : high}`}
        className="paper-range mt-3 w-full"
        style={{ '--track': track } as React.CSSProperties}
      />
      <div className="mt-1 flex justify-between font-mono text-[11px] uppercase tracking-[0.1em] text-ink-soft" aria-hidden="true">
        <span>{low}</span>
        <span>{high}</span>
      </div>
    </div>
  );

  return (
    <Popover>
      <PopoverTrigger asChild>
        <button
          type="button"
          aria-label={p.title}
          title={p.title}
          className="inline-flex h-11 w-11 items-center justify-center rounded-sm text-ink hover:bg-zinc-100 md:h-9 md:w-9"
        >
          <Sun size={20} aria-hidden="true" />
        </button>
      </PopoverTrigger>
      <PopoverContent align="end" aria-label={p.title} className="w-80 rounded-sm border-ink bg-paper p-0 text-ink">
        <div className="flex items-center justify-between border-b border-rule px-4 py-2.5">
          <p className="font-mono text-[11px] uppercase tracking-[0.14em] text-ink-soft">{p.title}</p>
          <span aria-hidden="true" className="h-4 w-8 rounded-sm border border-ink" style={{ background: paper }} />
        </div>
        {slider(bId, settings.brightness, (brightness) => setSettings((s) => ({ ...s, brightness })), p.brightness, p.soft, p.bright,
          <Sun size={20} aria-hidden="true" />, 'linear-gradient(90deg, #bdbbb6, #f5f6f3)')}
        <div className="border-t border-rule" />
        {slider(wId, settings.warmth, (warmth) => setSettings((s) => ({ ...s, warmth })), p.warmth, p.cool, p.warm,
          <Thermometer size={20} aria-hidden="true" />, 'linear-gradient(90deg, #f5f6f3, #eceae5, #ecddbf)')}
        <div className="flex items-center justify-between gap-3 border-t border-rule px-4 py-3">
          <p className="text-[12px] text-ink-soft" aria-live="polite">
            {fmt(p.contrast, { ratio: minRatio.toFixed(1) })}
          </p>
          <button
            type="button"
            onClick={() => setSettings(defaultPaper)}
            className="rounded-sm px-2 py-1 text-[12px] underline underline-offset-4 hover:bg-zinc-100"
          >
            {p.reset}
          </button>
        </div>
        <p className="border-t border-rule px-4 py-3 text-[12px] leading-snug text-ink-soft">{p.note}</p>
      </PopoverContent>
    </Popover>
  );
}
