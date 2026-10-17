import { Globe } from 'lucide-react';
import { locales, useI18n, type Locale } from '../i18n';

/**
 * A native select laid transparently over a compact label: it stays fully keyboard and
 * screen-reader accessible on every platform while only taking the width of "EN".
 */
export function LanguageSwitcher() {
  const { locale, setLocale, m } = useI18n();
  return (
    <div className="relative inline-flex h-9 items-center justify-center gap-1.5 rounded-sm px-2 text-[13px] font-medium leading-none text-ink hover:bg-zinc-100 focus-within:outline-2 focus-within:outline-offset-2 focus-within:outline-[var(--focus)]">
      <Globe size={20} aria-hidden="true" />
      <span aria-hidden="true">{locales[locale].short}</span>
      <select
        value={locale}
        onChange={(e) => setLocale(e.target.value as Locale)}
        aria-label={m.app.language}
        title={m.app.language}
        className="absolute inset-0 h-full w-full cursor-pointer appearance-none opacity-0"
      >
        {(Object.keys(locales) as Locale[]).map((code) => (
          <option key={code} value={code} lang={code}>
            {locales[code].label}
          </option>
        ))}
      </select>
    </div>
  );
}
