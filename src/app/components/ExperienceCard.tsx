import { motion } from 'motion/react';
import { Building2, MapPin } from 'lucide-react';
import { BrandIcon } from './BrandIcon';
import { dateRange } from '../cv/format';
import type { Experience } from '../cv/types';

interface ExperienceCardProps extends Experience {
  index: number;
}

export function ExperienceCard({
  title,
  company,
  location,
  employmentType,
  start,
  end,
  bullets,
  logo,
  index
}: ExperienceCardProps) {
  const dates = dateRange(start, end);
  const period = dates || employmentType;
  const items = bullets.filter((b) => b.trim());
  return (
    <motion.article
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.1, duration: 0.4 }}
      className="group relative bg-white dark:bg-zinc-900/50 border border-zinc-200 dark:border-zinc-800 rounded-lg p-6 hover:border-zinc-300 dark:hover:border-zinc-700 transition-colors duration-200"
    >
      <div className="flex gap-4 items-start">
        {/* Company logo - full-frame tile */}
        <div className="flex-shrink-0 w-10 h-10 rounded-md overflow-hidden ring-1 ring-inset ring-black/5 dark:ring-white/10">
          <BrandIcon src={logo} name={company} fill />
        </div>

        <div className="flex-1 min-w-0 space-y-2">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1">
            <h3 className="font-semibold text-zinc-900 dark:text-zinc-100 text-base">
              {title}
            </h3>
            {period && (
              <span className="self-start sm:self-auto text-xs font-mono text-zinc-600 dark:text-zinc-300 bg-zinc-100 dark:bg-zinc-800 px-2 py-0.5 rounded whitespace-nowrap">
                {period}
              </span>
            )}
          </div>

          <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-zinc-600 dark:text-zinc-400">
            <div className="flex items-center gap-1.5">
              <Building2 size={14} aria-hidden="true" />
              <span className="font-medium">{company}</span>
            </div>
            {location && (
              <div className="flex items-center gap-1.5">
                <MapPin size={14} aria-hidden="true" />
                <span>{location}</span>
              </div>
            )}
            {employmentType && dates && <span>{employmentType}</span>}
          </div>

          {items.length > 0 && (
            <ul className="list-disc pl-4 space-y-1 text-sm text-zinc-600 dark:text-zinc-400 leading-relaxed pt-1 marker:text-zinc-400 dark:marker:text-zinc-500">
              {items.map((b, i) => (
                <li key={i}>{b}</li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </motion.article>
  );
}
