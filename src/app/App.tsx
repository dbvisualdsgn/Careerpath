import { useEffect, useState } from 'react';
import { motion } from 'motion/react';
import { Mail, Zap, Share2, Download, Phone, MapPin, Linkedin, PencilLine } from 'lucide-react';
import { ThemeProvider } from 'next-themes';
import { Toaster, toast } from 'sonner';
import { TooltipProvider } from './components/ui/tooltip';
import { ToolBadge } from './components/ToolBadge';
import { ExperienceCard } from './components/ExperienceCard';
import { CertificationCard } from './components/CertificationCard';
import { ThemeToggle } from './components/ThemeToggle';
import { HeroBackground } from './components/HeroBackground';
import { PrintCV } from './components/PrintCV';
import { CVEditor } from './components/editor/CVEditor';
import { Button } from './components/ui/button';
import { useCV } from './cv/useCV';
import { displayUrl, hrefUrl, initials, toJsonLd } from './cv/format';

const headingFont = { fontFamily: "'Space Grotesk', sans-serif" };
const sectionTitle = 'text-sm font-semibold text-zinc-900 dark:text-white uppercase tracking-wider';

export default function App() {
  const { cv, setCV, update } = useCV();
  const [editing, setEditing] = useState(false);
  const { profile } = cv;

  // Document title doubles as the default PDF file name when printing.
  useEffect(() => {
    document.title = [profile.name, profile.headline, 'CV'].filter(Boolean).join(' - ');
  }, [profile.name, profile.headline]);

  // Structured data so AI tools and search engines can parse the CV reliably.
  useEffect(() => {
    let el = document.getElementById('cv-jsonld') as HTMLScriptElement | null;
    if (!el) {
      el = document.createElement('script');
      el.type = 'application/ld+json';
      el.id = 'cv-jsonld';
      document.head.appendChild(el);
    }
    el.textContent = JSON.stringify(toJsonLd(cv));
  }, [cv]);

  const handleShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: `${profile.name} - CV`,
          text: `Check out ${profile.name}'s CV`,
          url: window.location.href,
        });
      } catch (err) {
        console.error('Error sharing:', err);
      }
    } else {
      navigator.clipboard.writeText(window.location.href);
      toast.success('Link copied to clipboard');
    }
  };

  const handleDownload = () => {
    toast('Choose "Save as PDF" and untick "Headers and footers"', {
      description: 'Browser headers add the URL and date to your PDF text, which ATS parsers read as noise.',
    });
    // Let the toast render before the print dialog blocks the page.
    setTimeout(() => window.print(), 300);
  };

  const contacts = [
    profile.email && { icon: Mail, label: profile.email, href: `mailto:${profile.email}` },
    profile.phone && { icon: Phone, label: profile.phone, href: `tel:${profile.phone.replace(/[^\d+]/g, '')}` },
    profile.location && { icon: MapPin, label: profile.location },
    profile.linkedin && { icon: Linkedin, label: displayUrl(profile.linkedin), href: hrefUrl(profile.linkedin) },
    profile.website && { icon: GlobeIcon, label: displayUrl(profile.website), href: hrefUrl(profile.website) },
  ].filter(Boolean) as { icon: React.ComponentType<{ size?: number }>; label: string; href?: string }[];

  return (
    <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
      <TooltipProvider>
        <div className="min-h-screen bg-white dark:bg-zinc-950 text-zinc-900 dark:text-zinc-50 transition-colors duration-300 font-sans selection:bg-blue-500/20 print:bg-white print:min-h-0" style={{ fontFamily: "'Manrope', sans-serif" }}>
          <Toaster className="print:hidden" />

          <style>{`
            @media print {
              @page { margin: 14mm 16mm; }
              body { background: white !important; }
            }
          `}</style>

          {/* ATS-friendly single-column version, shown only when printing / saving as PDF */}
          <PrintCV cv={cv} />

          <div className={`print:hidden transition-[padding] duration-300 ${editing ? 'lg:pr-[480px]' : ''}`}>
            {/* Header */}
            <header className="sticky top-0 z-40 w-full border-b border-zinc-200 dark:border-zinc-800 bg-white/80 dark:bg-zinc-950/80 backdrop-blur-md">
              <nav className="max-w-5xl mx-auto px-4 sm:px-6 h-16 flex justify-between items-center">
                <div className="text-sm font-bold tracking-tight text-zinc-900 dark:text-zinc-100" style={headingFont}>
                  {initials(profile.name)}.CV
                </div>
                <div className="flex items-center gap-1 sm:gap-2">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={handleShare}
                    className="hidden sm:flex gap-2 text-zinc-500 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-100"
                  >
                    <Share2 size={16} />
                    Share
                  </Button>
                  <Button
                    variant={editing ? 'secondary' : 'ghost'}
                    size="sm"
                    onClick={() => setEditing((v) => !v)}
                    className="gap-2 text-xs h-9"
                  >
                    <PencilLine size={16} />
                    <span className="hidden sm:inline">Edit CV</span>
                    <span className="sm:hidden">Edit</span>
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleDownload}
                    className="gap-2 text-xs h-9"
                  >
                    <Download size={16} />
                    <span className="hidden sm:inline">Download PDF</span>
                    <span className="sm:hidden">PDF</span>
                  </Button>
                  <div className="w-px h-4 bg-zinc-200 dark:bg-zinc-800 mx-1 sm:mx-2" />
                  <ThemeToggle />
                </div>
              </nav>
            </header>

            <div className="relative">
              <HeroBackground />

              {/* Main Layout */}
              <main className="max-w-5xl mx-auto px-4 sm:px-6 py-12 md:py-20">
                <div className="grid grid-cols-1 md:grid-cols-[minmax(0,1fr)_minmax(0,2fr)] gap-12 lg:gap-16">

                  {/* Left Sidebar / Intro Column */}
                  <div className="space-y-12">

                    {/* Name Block */}
                    <motion.div
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.5 }}
                      className="space-y-4"
                    >
                      <div>
                        <h1 className="text-4xl font-bold tracking-tight text-zinc-900 dark:text-white" style={headingFont}>
                          {profile.name}
                        </h1>
                        <p className="text-lg text-zinc-500 dark:text-zinc-400 font-medium">
                          {profile.headline}
                        </p>
                      </div>

                      <address className="not-italic flex flex-col gap-2 text-sm text-zinc-600 dark:text-zinc-400">
                        {contacts.map(({ icon: Icon, label, href }) =>
                          href ? (
                            <a
                              key={label}
                              href={href}
                              target={href.startsWith('http') ? '_blank' : undefined}
                              rel="noopener noreferrer"
                              className="flex items-center gap-2 hover:text-blue-500 transition-colors break-all"
                            >
                              <Icon size={16} />
                              <span>{label}</span>
                            </a>
                          ) : (
                            <span key={label} className="flex items-center gap-2">
                              <Icon size={16} />
                              <span>{label}</span>
                            </span>
                          ),
                        )}
                      </address>
                    </motion.div>

                    {/* Summary */}
                    {cv.summary.trim() && (
                      <section>
                        <h2 className={`${sectionTitle} mb-4`} style={headingFont}>Professional Summary</h2>
                        <p className="text-sm leading-relaxed text-zinc-600 dark:text-zinc-400 whitespace-pre-line">
                          {cv.summary}
                        </p>
                      </section>
                    )}

                    {/* Core skills */}
                    {cv.skills.length > 0 && (
                      <section>
                        <h2 className={`${sectionTitle} mb-4`} style={headingFont}>Skills</h2>
                        <ul className="flex flex-wrap gap-x-2 gap-y-1.5 text-sm text-zinc-600 dark:text-zinc-400">
                          {cv.skills.map((s) => (
                            <li key={s} className="rounded-full border border-zinc-200 dark:border-zinc-800 px-2.5 py-0.5">{s}</li>
                          ))}
                        </ul>
                      </section>
                    )}

                    {cv.education.length > 0 && (
                      <section>
                        <h2 className={`${sectionTitle} mb-4`} style={headingFont}>Education</h2>
                        <div className="space-y-3">
                          {cv.education.map((e, index) => (
                            <CertificationCard
                              key={e.id}
                              title={e.degree}
                              description={[e.location, e.details].filter(Boolean).join(' · ')}
                              institution={e.school}
                              year={[e.start, e.end].filter(Boolean).join(' – ')}
                              index={index}
                              icon="education"
                            />
                          ))}
                        </div>
                      </section>
                    )}

                    {cv.certifications.length > 0 && (
                      <section>
                        <h2 className={`${sectionTitle} mb-4`} style={headingFont}>Certifications</h2>
                        <div className="space-y-3">
                          {cv.certifications.map((cert, index) => (
                            <CertificationCard
                              key={cert.id}
                              title={cert.title}
                              description={cert.description}
                              institution={cert.issuer}
                              year={cert.year}
                              index={index}
                            />
                          ))}
                        </div>
                      </section>
                    )}

                    {cv.languages.length > 0 && (
                      <section>
                        <h2 className={`${sectionTitle} mb-4`} style={headingFont}>Languages</h2>
                        <ul className="space-y-1 text-sm text-zinc-600 dark:text-zinc-400">
                          {cv.languages.map((l) => (
                            <li key={l.id} className="flex justify-between gap-4">
                              <span className="text-zinc-900 dark:text-zinc-100">{l.name}</span>
                              <span>{l.level}</span>
                            </li>
                          ))}
                        </ul>
                      </section>
                    )}
                  </div>

                  {/* Right Content Column */}
                  <div className="space-y-16">

                    {cv.tools.length > 0 && (
                      <section>
                        <h2 className={`${sectionTitle} mb-6 flex items-center gap-2`} style={headingFont}>
                          <Zap size={16} className="text-zinc-400" aria-hidden="true" />
                          Stack & Tools
                        </h2>
                        <ul className="flex flex-wrap gap-2">
                          {cv.tools.map((tool) => (
                            <ToolBadge key={tool.id} icon={tool.icon} name={tool.name} description={tool.description} />
                          ))}
                        </ul>
                      </section>
                    )}

                    {/* Experience Section */}
                    <section>
                      <h2 className={`${sectionTitle} mb-8 flex items-center gap-2`} style={headingFont}>
                        <BriefcaseIcon />
                        Work Experience
                      </h2>
                      <div className="space-y-4">
                        {cv.experience.map((exp, index) => (
                          <ExperienceCard key={exp.id} {...exp} index={index} />
                        ))}
                        {cv.experience.length === 0 && (
                          <button
                            type="button"
                            onClick={() => setEditing(true)}
                            className="w-full rounded-lg border border-dashed border-zinc-300 dark:border-zinc-700 p-8 text-sm text-zinc-500 hover:border-zinc-400"
                          >
                            Add your first role in the editor
                          </button>
                        )}
                      </div>
                    </section>

                  </div>
                </div>
              </main>

              {/* Footer */}
              <footer className="border-t border-zinc-200 dark:border-zinc-800 py-12 text-center">
                <div className="max-w-5xl mx-auto px-4 sm:px-6 flex flex-col md:flex-row justify-between items-center gap-6 text-sm text-zinc-500 dark:text-zinc-500">
                  <p>© {new Date().getFullYear()} {profile.name}. All rights reserved.</p>
                  {profile.email && (
                    <a href={`mailto:${profile.email}`} className="hover:text-zinc-900 dark:hover:text-zinc-300 transition-colors">Contact</a>
                  )}
                </div>
              </footer>
            </div>
          </div>

          <CVEditor open={editing} onOpenChange={setEditing} cv={cv} setCV={setCV} update={update} />
        </div>
      </TooltipProvider>
    </ThemeProvider>
  );
}

function BriefcaseIcon() {
  return (
    <svg
      className="text-zinc-400"
      aria-hidden="true"
      width="16"
      height="16"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <rect width="20" height="14" x="2" y="7" rx="2" ry="2" />
      <path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16" />
    </svg>
  );
}

function GlobeIcon({ size = 16 }: { size?: number }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden="true"
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <circle cx="12" cy="12" r="10" />
      <line x1="2" x2="22" y1="12" y2="12" />
      <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1 4-10z" />
    </svg>
  )
}
