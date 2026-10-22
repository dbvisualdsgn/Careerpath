import { initials } from '../cv/format';

interface PortraitProps {
  photo?: string;
  name: string;
  alt?: string;
  className?: string;
}

/** Square portrait in the UI's monochrome, no rounding: the photo is grayscale and multiplied onto the paper;
 *  without a photo, the initials are set large in the title font on black. */
export function Portrait({ photo, name, alt, className = '' }: PortraitProps) {
  if (photo) {
    return (
      <span className={`block overflow-hidden bg-paper ring-1 ring-inset ring-rule ${className}`}>
        <img
          src={photo}
          alt={alt ?? ''}
          className="h-full w-full object-cover grayscale contrast-[1.1] mix-blend-multiply"
        />
      </span>
    );
  }
  return (
    <span
      aria-hidden="true"
      className={`flex items-end bg-ink p-2 font-title leading-none tracking-[-0.04em] text-paper ${className}`}
    >
      {initials(name)}
    </span>
  );
}
