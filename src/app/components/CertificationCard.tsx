import { Award, GraduationCap } from 'lucide-react';

interface CertificationCardProps {
  title: string;
  description?: string;
  institution: string;
  year?: string;
  index: number;
  icon?: 'award' | 'education';
}

/** A ruled list row for education and certifications. */
export function CertificationCard({ title, description, institution, year, icon = 'award' }: CertificationCardProps) {
  const Icon = icon === 'education' ? GraduationCap : Award;
  return (
    <li className="grid grid-cols-[1.5rem_minmax(0,1fr)] gap-x-4 border-t border-rule py-5 first:border-t-0 first:pt-1">
      <Icon size={18} strokeWidth={1.5} aria-hidden="true" className="mt-1 text-ink-soft" />
      <div className="flex flex-col justify-between gap-1 sm:flex-row sm:items-baseline sm:gap-6">
        <div className="min-w-0">
          <h3 className="text-lg font-medium leading-snug">{title}</h3>
          <p className="mt-1 font-sans text-[14px] text-ink-soft">{[description, institution].filter(Boolean).join(' · ')}</p>
        </div>
        {year && <span className="whitespace-nowrap font-mono text-[12px] text-ink-soft">{year}</span>}
      </div>
    </li>
  );
}
