import { motion } from 'motion/react';
import { Building2, MapPin, Calendar } from 'lucide-react';

interface ExperienceCardProps {
  title: string;
  company: string;
  location: string;
  period: string;
  description: string;
  companyIcon?: string;
  index: number;
}

export function ExperienceCard({
  title,
  company,
  location,
  period,
  description,
  companyIcon = '🏢',
  index
}: ExperienceCardProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.1, duration: 0.4 }}
      className="group relative bg-white dark:bg-zinc-900/50 border border-zinc-200 dark:border-zinc-800 rounded-lg p-6 hover:border-zinc-300 dark:hover:border-zinc-700 transition-colors duration-200"
    >
      <div className="flex gap-4 items-start">
        {/* Company Icon - Minimalist Box */}
        <div className="flex-shrink-0">
          <div className="w-10 h-10 rounded-md bg-zinc-100 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 flex items-center justify-center text-lg">
            {companyIcon}
          </div>
        </div>

        <div className="flex-1 min-w-0 space-y-2">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1">
            <h4 className="font-semibold text-zinc-900 dark:text-zinc-100 text-base">
              {title}
            </h4>
            <span className="text-xs font-mono text-zinc-500 dark:text-zinc-400 bg-zinc-100 dark:bg-zinc-800 px-2 py-0.5 rounded">
              {period}
            </span>
          </div>

          <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-zinc-600 dark:text-zinc-400">
            <div className="flex items-center gap-1.5">
              <Building2 size={14} />
              <span className="font-medium">{company}</span>
            </div>
            <div className="flex items-center gap-1.5 text-zinc-400 dark:text-zinc-500">
              <MapPin size={14} />
              <span>{location}</span>
            </div>
          </div>

          <p className="text-sm text-zinc-600 dark:text-zinc-400 leading-relaxed pt-1">
            {description}
          </p>
        </div>
      </div>
    </motion.div>
  );
}
