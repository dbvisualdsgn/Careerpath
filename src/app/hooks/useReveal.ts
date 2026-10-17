import { useEffect, useLayoutEffect, useRef, useState } from 'react';

/** Adds `is-in` once the element scrolls into view (used by the .reveal / .hl-draw / .bar-grow styles).
 *  Belt and braces, so content can never stay invisible: an IntersectionObserver, a scroll check as a
 *  fallback, a timer as a last resort, and the class re-applied after every render. */
export function useReveal<T extends HTMLElement>(threshold = 0.2) {
  const ref = useRef<T>(null);
  // With reduced motion there is nothing to reveal: content is shown from the start.
  const [inView, setInView] = useState(() => Boolean(window.matchMedia?.('(prefers-reduced-motion: reduce)').matches));

  useEffect(() => {
    const el = ref.current;
    if (!el || inView) return;
    const reveal = () => setInView(true);
    const check = () => {
      const r = el.getBoundingClientRect();
      if (r.top < window.innerHeight * 0.95 && r.bottom > 0) reveal();
      // Scrolled past it entirely (fast jump): show it too.
      else if (r.bottom <= 0) reveal();
    };
    let io: IntersectionObserver | undefined;
    if ('IntersectionObserver' in window) {
      io = new IntersectionObserver(([entry]) => entry.isIntersecting && reveal(), { threshold });
      io.observe(el);
    }
    window.addEventListener('scroll', check, { passive: true });
    window.addEventListener('resize', check);
    const raf = requestAnimationFrame(check);
    const fallback = window.setTimeout(reveal, 2500);
    return () => {
      io?.disconnect();
      window.removeEventListener('scroll', check);
      window.removeEventListener('resize', check);
      cancelAnimationFrame(raf);
      window.clearTimeout(fallback);
    };
  }, [threshold, inView]);

  // Keep the class even if React rewrites className on a later render.
  useLayoutEffect(() => {
    if (inView) ref.current?.classList.add('is-in');
  });

  return ref;
}

/** Counts up to `value` once (instantly when the user prefers reduced motion). */
export function useCountUp(value: number, duration = 700) {
  const [shown, setShown] = useState(value);
  const from = useRef(value);
  useEffect(() => {
    const reduce = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
    if (reduce || from.current === value) {
      setShown(value);
      from.current = value;
      return;
    }
    const start = performance.now();
    const a = from.current;
    let raf = 0;
    const tick = (t: number) => {
      const k = Math.min(1, (t - start) / duration);
      const eased = 1 - Math.pow(1 - k, 3);
      setShown(Math.round(a + (value - a) * eased));
      if (k < 1) raf = requestAnimationFrame(tick);
      else from.current = value;
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [value, duration]);
  return shown;
}
