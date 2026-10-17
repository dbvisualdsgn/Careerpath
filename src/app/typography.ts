import { useEffect, useState } from 'react';

export type TypeStyle = 'sans' | 'serif' | 'mono';
export const typeStyles: TypeStyle[] = ['sans', 'serif', 'mono'];

const STORAGE_KEY = 'curricula.type';

function initialType(): TypeStyle {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved && (typeStyles as string[]).includes(saved)) return saved as TypeStyle;
  } catch {
    // Storage unavailable: use the default.
  }
  return 'sans';
}

/** Reading style chosen with the "Aa" switch; drives --reading-font through data-type on <html>. */
export function useTypeStyle() {
  const [type, setType] = useState<TypeStyle>(initialType);
  useEffect(() => {
    document.documentElement.dataset.type = type;
    try {
      localStorage.setItem(STORAGE_KEY, type);
    } catch {
      // Not critical.
    }
  }, [type]);
  return [type, setType] as const;
}
