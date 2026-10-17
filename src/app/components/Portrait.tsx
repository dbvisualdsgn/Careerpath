import { initials } from '../cv/format';

interface PortraitProps {
  photo?: string;
  name: string;
  alt?: string;
  className?: string;
}

/** Square portrait in the UI's monochrome: the photo is grayscale and multiplied onto the paper;
 *  without a photo, the initials are set large in the reading font. */
export function Portrait({ photo, name, alt, className = '' }: PortraitProps) {
  if (photo) {
    return (
      <span className={`block overflow-hidden rounded-sm bg-paper ring-1 ring-inset ring-rule ${className}`}>
        <img
          src={photo}
          alt={alt ?? ''}
          className="h-full w-full object-cover grayscale contrast-[1.05] mix-blend-multiply dark:mix-blend-normal dark:brightness-90"
        />
      </span>
    );
  }
  return (
    <span
      aria-hidden="true"
      className={`flex items-end rounded-sm bg-ink p-2 font-title leading-none tracking-[-0.04em] text-paper ${className}`}
    >
      {initials(name)}
    </span>
  );
}
