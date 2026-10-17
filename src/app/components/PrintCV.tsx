import { contactItems, dateRange } from '../cv/format';
import type { CVData } from '../cv/types';

/**
 * ATS-friendly layout used only for printing / "Save as PDF":
 * single column, standard section headings, real text (no icons or images),
 * contact details in the body, and dates on the same line as each role.
 */
export function PrintCV({ cv }: { cv: CVData }) {
  const { profile } = cv;
  const Section = ({ title, children }: { title: string; children: React.ReactNode }) => (
    <section className="mt-5 break-inside-avoid-page">
      <h2 className="text-[11pt] font-bold uppercase tracking-wide border-b border-black pb-0.5 mb-2">{title}</h2>
      {children}
    </section>
  );

  return (
    <div className="hidden print:block text-black bg-white text-[10pt] leading-snug" style={{ fontFamily: 'Arial, Helvetica, sans-serif' }}>
      <header>
        <h1 className="text-[20pt] font-bold leading-tight">{profile.name}</h1>
        {profile.headline && <p className="text-[12pt]">{profile.headline}</p>}
        <p className="mt-1">{contactItems(cv).join('  |  ')}</p>
      </header>

      {cv.summary.trim() && (
        <Section title="Professional Summary">
          <p>{cv.summary}</p>
        </Section>
      )}

      {(cv.skills.length > 0 || cv.tools.length > 0) && (
        <Section title="Skills">
          {cv.skills.length > 0 && (
            <p>
              <strong>Core skills:</strong> {cv.skills.join(', ')}
            </p>
          )}
          {cv.tools.length > 0 && (
            <p>
              <strong>Tools:</strong> {cv.tools.map((t) => t.name).join(', ')}
            </p>
          )}
        </Section>
      )}

      {cv.experience.length > 0 && (
        <Section title="Work Experience">
          {cv.experience.map((e) => (
            <div key={e.id} className="mb-3 break-inside-avoid">
              <div className="flex justify-between gap-4">
                <h3 className="font-bold">{e.title}</h3>
                <span className="whitespace-nowrap">{dateRange(e.start, e.end)}</span>
              </div>
              <p>{[e.company, e.location, e.employmentType].filter(Boolean).join(' | ')}</p>
              <ul className="list-disc pl-5 mt-1">
                {e.bullets.filter((b) => b.trim()).map((b, i) => (
                  <li key={i}>{b}</li>
                ))}
              </ul>
            </div>
          ))}
        </Section>
      )}

      {cv.education.length > 0 && (
        <Section title="Education">
          {cv.education.map((e) => (
            <div key={e.id} className="mb-2 break-inside-avoid">
              <div className="flex justify-between gap-4">
                <h3 className="font-bold">{e.degree}</h3>
                <span className="whitespace-nowrap">{dateRange(e.start, e.end)}</span>
              </div>
              <p>{[e.school, e.location].filter(Boolean).join(' | ')}</p>
              {e.details && <p>{e.details}</p>}
            </div>
          ))}
        </Section>
      )}

      {cv.certifications.length > 0 && (
        <Section title="Certifications">
          <ul className="list-disc pl-5">
            {cv.certifications.map((c) => (
              <li key={c.id}>
                {c.title}
                {c.description && ` (${c.description})`}
                {c.issuer && `, ${c.issuer}`}
                {c.year && `, ${c.year}`}
              </li>
            ))}
          </ul>
        </Section>
      )}

      {cv.languages.length > 0 && (
        <Section title="Languages">
          <p>{cv.languages.map((l) => (l.level ? `${l.name} (${l.level})` : l.name)).join(', ')}</p>
        </Section>
      )}
    </div>
  );
}
