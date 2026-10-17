import { useState } from 'react';

interface BrandIconProps {
  src?: string;
  name: string;
  size?: number;
  className?: string;
  /** Fill the parent tile edge to edge (company logos) instead of rendering at a fixed size. */
  fill?: boolean;
}

/** Aspect ratio of an SVG data URL, read from its viewBox. */
function svgAspect(src: string) {
  if (!src.startsWith('data:image/svg')) return undefined;
  const svg = src.includes(';base64,') ? atob(src.split(',')[1]) : decodeURIComponent(src.split(',')[1] ?? '');
  const vb = svg.match(/viewBox="[\d.-]+\s+[\d.-]+\s+([\d.]+)\s+([\d.]+)"/);
  return vb ? Number(vb[1]) / Number(vb[2]) : undefined;
}

const isSquare = (ratio: number | undefined) => ratio === undefined || Math.abs(ratio - 1) < 0.15;

function Monogram({ name, size, fill, className = '' }: { name: string; size: number; fill?: boolean; className?: string }) {
  return (
    <span
      aria-hidden="true"
      className={`inline-flex shrink-0 items-center justify-center bg-zinc-900 text-white dark:bg-zinc-100 dark:text-zinc-900 font-semibold leading-none ${fill ? 'h-full w-full' : 'rounded-[4px]'} ${className}`}
      style={fill ? { fontSize: '1rem' } : { width: size, height: size, fontSize: Math.round(size * 0.6) }}
    >
      {name.trim().charAt(0).toUpperCase() || '?'}
    </span>
  );
}

/** Renders an official logo from a data URL, or a monogram when no logo is set. Always decorative. */
export function BrandIcon({ src, name, size = 16, className = '', fill = false }: BrandIconProps) {
  const [rasterSquare, setRasterSquare] = useState(true);

  if (!src) return <Monogram name={name} size={size} fill={fill} className={className} />;

  if (fill) {
    // Square logos (app icons, uploads) bleed to the edges; other shapes are fitted on a white tile.
    const square = isSquare(svgAspect(src)) && rasterSquare;
    return (
      <img
        src={src}
        alt=""
        aria-hidden="true"
        onLoad={(e) => {
          const { naturalWidth: w, naturalHeight: h } = e.currentTarget;
          if (!src.startsWith('data:image/svg') && w && h) setRasterSquare(isSquare(w / h));
        }}
        className={`block h-full w-full ${square ? 'object-cover' : 'object-contain bg-white p-1.5'} ${className}`}
      />
    );
  }

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
