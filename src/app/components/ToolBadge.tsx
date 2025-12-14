import { Tooltip, TooltipTrigger, TooltipContent } from './ui/tooltip';
import { LucideIcon } from 'lucide-react';

interface ToolBadgeProps {
  icon: LucideIcon;
  name: string;
  description: string;
  color?: string;
}

export function ToolBadge({ icon: Icon, name, description }: ToolBadgeProps) {
  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <button
          className="group relative inline-flex items-center gap-2 px-3 py-2 rounded-md bg-zinc-100 dark:bg-zinc-800/50 border border-zinc-200 dark:border-zinc-700 text-zinc-900 dark:text-zinc-100 hover:border-zinc-300 dark:hover:border-zinc-600 transition-all duration-200 cursor-pointer"
        >
          <Icon size={16} className="text-zinc-500 dark:text-zinc-400 group-hover:text-zinc-900 dark:group-hover:text-zinc-100 transition-colors" />
          <span className="text-sm font-medium">{name}</span>
        </button>
      </TooltipTrigger>
      <TooltipContent side="top" className="max-w-xs bg-zinc-900 text-zinc-50 dark:bg-zinc-100 dark:text-zinc-900 border-zinc-800 dark:border-zinc-200">
        <p className="text-xs">{description}</p>
      </TooltipContent>
    </Tooltip>
  );
}
