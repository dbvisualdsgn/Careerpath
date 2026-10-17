interface BrandIconProps {
  src?: string;
  name: string;
  size?: number;
  className?: string;
}

/** Renders an official logo from a data URL, or a monogram when no logo is set. */
export function BrandIcon({ src, name, size = 16, className = '' }: BrandIconProps) {
  if (src) {
    return (
      <img
        src={src}
        alt=""
        aria-hidden="true"
        width={size}
        height={size}
        className={`object-contain shrink-0 ${className}`}
        style={{ width: size, height: size }}
      />
    );
  }
  return (
    <span
      aria-hidden="true"
      className={`inline-flex shrink-0 items-center justify-center rounded-[4px] bg-zinc-900 text-white dark:bg-zinc-100 dark:text-zinc-900 font-semibold leading-none ${className}`}
      style={{ width: size, height: size, fontSize: Math.round(size * 0.6) }}
    >
      {name.trim().charAt(0).toUpperCase() || '?'}
    </span>
  );
}
