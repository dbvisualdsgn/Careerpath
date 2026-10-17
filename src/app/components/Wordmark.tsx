/** The brand: "curriculi curricula" set in the reading font. Type only, no logo. */
export function Wordmark({ href }: { href: string }) {
  return (
    <a href={href} className="inline-block whitespace-nowrap rounded-sm font-reading text-[15px] leading-none tracking-[-0.01em] text-ink sm:text-[17px]">
      curriculi <span className="italic">curricula</span>
    </a>
  );
}
