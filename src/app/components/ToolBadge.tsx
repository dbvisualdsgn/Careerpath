import { BrandIcon } from './BrandIcon';

interface ToolBadgeProps {
  icon?: string;
  name: string;
  description: string;
}

/** Tool name and description as visible text, so ATS parsers and screen readers read both. */
export function ToolBadge({ icon, name, description }: ToolBadgeProps) {
  return (
    <li className="flex items-center gap-3 border-b border-r border-rule bg-paper px-4 py-3">
      {/* Logos keep their colours; in night mode they sit on a light tile so dark marks stay visible. */}
      <span className="inline-flex shrink-0 dark:rounded-sm dark:bg-[#eceae5] dark:p-0.5">
        <BrandIcon src={icon} name={name} size={18} />
      </span>
      <span className="min-w-0">
        <span className="block text-[15px] font-medium">{name}</span>
        {description && <span className="block font-sans text-[13px] text-ink-soft">{description}</span>}
      </span>
    </li>
  );
}
