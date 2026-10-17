import { BrandIcon } from './BrandIcon';

interface ToolBadgeProps {
  icon?: string;
  name: string;
  description: string;
}

/** Tool name and description as visible text, so ATS parsers and screen readers read both. */
export function ToolBadge({ icon, name, description }: ToolBadgeProps) {
  return (
    <li className="flex items-center gap-3 rounded-md border border-zinc-200 bg-zinc-50 px-3 py-2 dark:border-zinc-700 dark:bg-zinc-800/50">
      {/* Logos sit on a light tile in dark mode so dark brand marks stay visible. */}
      <span className="inline-flex shrink-0 dark:rounded-[4px] dark:bg-white dark:p-0.5">
        <BrandIcon src={icon} name={name} size={18} />
      </span>
      <span className="min-w-0">
        <span className="block text-sm font-medium text-zinc-900 dark:text-zinc-100">{name}</span>
        {description && <span className="block text-xs text-zinc-600 dark:text-zinc-400">{description}</span>}
      </span>
    </li>
  );
}
