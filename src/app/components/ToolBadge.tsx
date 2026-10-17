import { Tooltip, TooltipTrigger, TooltipContent } from './ui/tooltip';
import { BrandIcon } from './BrandIcon';

interface ToolBadgeProps {
  icon?: string;
  name: string;
  description: string;
}

export function ToolBadge({ icon, name, description }: ToolBadgeProps) {
  const badge = (
    <li tabIndex={description ? 0 : undefined} className="group relative inline-flex items-center gap-2 px-3 py-2 rounded-md bg-zinc-100 dark:bg-zinc-800/50 border border-zinc-200 dark:border-zinc-700 text-zinc-900 dark:text-zinc-100 hover:border-zinc-300 dark:hover:border-zinc-600 transition-all duration-200 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-500">
      {/* Logos sit on a light tile in dark mode so dark brand marks stay visible. */}
      <span className="inline-flex dark:bg-white dark:rounded-[4px] dark:p-0.5">
        <BrandIcon src={icon} name={name} size={16} />
      </span>
      <span className="text-sm font-medium">{name}</span>
    </li>
  );

  if (!description) return badge;
  return (
    <Tooltip>
      <TooltipTrigger asChild>{badge}</TooltipTrigger>
      <TooltipContent side="top" className="max-w-xs bg-zinc-900 text-zinc-50 dark:bg-zinc-100 dark:text-zinc-900 border-zinc-800 dark:border-zinc-200">
        <p className="text-xs">{description}</p>
      </TooltipContent>
    </Tooltip>
  );
}
