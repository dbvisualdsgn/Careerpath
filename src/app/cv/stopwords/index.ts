// Stopwords per UI locale. English is always included, since many ads mix it in.
import en from './en';
import fr from './fr';
import it from './it';
import es from './es';
import de from './de';
import pt from './pt';
import nl from './nl';

const lists: Record<string, string> = { en, fr, it, es, de, pt, nl };
const toSet = (s: string) => s.normalize('NFC').toLowerCase().split(/\s+/).filter(Boolean);
const cache = new Map<string, Set<string>>();

export function stopwordsFor(locale: string): Set<string> {
  const key = locale in lists ? locale : 'en';
  let set = cache.get(key);
  if (!set) {
    set = new Set([...toSet(en), ...(key === 'en' ? [] : toSet(lists[key]))]);
    cache.set(key, set);
  }
  return set;
}
