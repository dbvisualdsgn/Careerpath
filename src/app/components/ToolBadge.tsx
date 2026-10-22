import { BrandIcon } from './BrandIcon';

interface ToolBadgeProps {
  icon?: string;
  name: string;
  description: string;
}

/** A tool as a pill, matching the core skills: logo + name. The description shows on hover and to screen readers. */
export function ToolBadge({ icon, name, description }: ToolBadgeProps) {
  return (
    <li title={description || undefined} className="inline-flex items-center gap-2 rounded-sm border border-ink px-2.5 py-1 text-[15px]">
      {/* Logos keep their colours; in night mode they sit on a light tile so dark marks stay visible. */}
      <span className="inline-flex shrink-0">
        <BrandIcon src={icon} name={name} size={16} />
      </span>
      {name}
      {description && <span className="sr-only">: {description}</span>}
    </li>
  );
}
