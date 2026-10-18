import { initials } from '../cv/format';

interface PortraitProps {
  photo?: string;
  name: string;
  alt?: string;
  className?: string;
  /** Stays at full strength in the skim view, like the name. */
  skimKeep?: boolean;
}

/** Square portrait in the UI's monochrome, no rounding: the photo is grayscale and multiplied onto the paper;
 *  without a photo, the initials are set large in the title font on black. */
export function Portrait({ photo, name, alt, className = '', skimKeep = false }: PortraitProps) {
  const keep = skimKeep ? { 'data-skim-keep': '' } : {};
  if (photo) {
    return (
      <span {...keep} className={`block overflow-hidden bg-paper ring-1 ring-inset ring-rule ${className}`}>
        <img
          src={photo}
          alt={alt ?? ''}
          className="h-full w-full object-cover grayscale contrast-[1.1] mix-blend-multiply dark:mix-blend-normal dark:brightness-90"
        />
      </span>
    );
  }
  return (
    <span
      {...keep}
      aria-hidden="true"
      className={`flex items-end bg-ink p-2 font-title leading-none tracking-[-0.04em] text-paper ${className}`}
    >
      {initials(name)}
    </span>
  );
}
