import { createContext, useContext, useEffect, useMemo, useState } from 'react';
import { en, type Messages } from './en';
import { it } from './it';
import { fr } from './fr';
import { es } from './es';
import { de } from './de';
import { pt } from './pt';
import { nl } from './nl';

export const locales = {
  en: { label: 'English', short: 'EN', messages: en },
  it: { label: 'Italiano', short: 'IT', messages: it },
  fr: { label: 'Français', short: 'FR', messages: fr },
  es: { label: 'Español', short: 'ES', messages: es },
  de: { label: 'Deutsch', short: 'DE', messages: de },
  pt: { label: 'Português', short: 'PT', messages: pt },
  nl: { label: 'Nederlands', short: 'NL', messages: nl },
} as const;

export type Locale = keyof typeof locales;

const STORAGE_KEY = 'careerpath.locale';
const DEFAULT_LOCALE: Locale = 'en';

/** Replaces {placeholders} in a message. */
export function fmt(message: string, params: Record<string, string | number> = {}) {
  return message.replace(/\{(\w+)\}/g, (match, key) => (key in params ? String(params[key]) : match));
}

interface I18nValue {
  locale: Locale;
  setLocale: (locale: Locale) => void;
  m: Messages;
}

const I18nContext = createContext<I18nValue | null>(null);

function initialLocale(): Locale {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved && saved in locales) return saved as Locale;
  } catch {
    // Storage unavailable: use the default.
  }
  return DEFAULT_LOCALE;
}

export function I18nProvider({ children }: { children: React.ReactNode }) {
  const [locale, setLocale] = useState<Locale>(initialLocale);

  useEffect(() => {
    document.documentElement.lang = locale;
    try {
      localStorage.setItem(STORAGE_KEY, locale);
    } catch {
      // Not critical.
    }
  }, [locale]);

  const value = useMemo(() => ({ locale, setLocale, m: locales[locale].messages }), [locale]);
  return <I18nContext.Provider value={value}>{children}</I18nContext.Provider>;
}

export function useI18n() {
  const ctx = useContext(I18nContext);
  if (!ctx) throw new Error('useI18n must be used inside I18nProvider');
  return ctx;
}
