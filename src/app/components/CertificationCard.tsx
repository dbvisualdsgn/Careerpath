import { motion } from 'motion/react';
import { Award, GraduationCap } from 'lucide-react';

interface CertificationCardProps {
  title: string;
  description?: string;
  institution: string;
  year?: string;
  index: number;
  icon?: 'award' | 'education';
}

export function CertificationCard({ title, description, institution, year, index, icon = 'award' }: CertificationCardProps) {
  const Icon = icon === 'education' ? GraduationCap : Award;
  return (
    <motion.div
      initial={{ opacity: 0, x: -10 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay: index * 0.08, duration: 0.3 }}
      className="group flex gap-4 p-4 rounded-lg bg-white dark:bg-zinc-900/30 border border-zinc-200 dark:border-zinc-800 hover:border-zinc-300 dark:hover:border-zinc-700 transition-colors"
    >
      <div className="flex-shrink-0 pt-1">
        <div className="w-8 h-8 rounded-full bg-zinc-100 dark:bg-zinc-800 flex items-center justify-center text-zinc-500 dark:text-zinc-400">
          <Icon size={16} aria-hidden="true" />
        </div>
      </div>

      <div className="flex-1 min-w-0 space-y-1">
        <h3 className="font-medium text-zinc-900 dark:text-zinc-100 text-sm">
          {title}
        </h3>
        {description && (
          <p className="text-xs text-zinc-500 dark:text-zinc-400">{description}</p>
        )}
        <div className="flex items-center gap-1.5 text-xs text-zinc-400 dark:text-zinc-500 pt-1">
          <GraduationCap size={12} aria-hidden="true" />
          <span>{[institution, year].filter(Boolean).join(' · ')}</span>
        </div>
      </div>
    </motion.div>
  );
}
