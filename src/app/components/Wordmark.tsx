/** The brand: "curriculi curricula" set in Switzer, whatever title font a visitor picks. Type only, no logo. */
export function Wordmark({ href }: { href: string }) {
  return (
    <a href={href} className="inline-block whitespace-nowrap rounded-sm font-sans text-[15px] leading-none tracking-[-0.01em] text-ink sm:text-[17px]">
      curriculi <span className="italic">curricula</span>
    </a>
  );
}
