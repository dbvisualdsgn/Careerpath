import { useEffect, useMemo, useState } from 'react';
import { MotionConfig, motion } from 'motion/react';
import { Mail, Zap, Share2, Download, Phone, MapPin, Linkedin, PencilLine, Gauge, Briefcase, Globe, Route, GraduationCap, Award, Languages } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import { ThemeProvider } from 'next-themes';
import { Toaster, toast } from 'sonner';
import { TooltipProvider } from './components/ui/tooltip';
import { ToolBadge } from './components/ToolBadge';
import { ExperienceCard } from './components/ExperienceCard';
import { CertificationCard } from './components/CertificationCard';
import { ThemeToggle } from './components/ThemeToggle';
import { LanguageSwitcher } from './components/LanguageSwitcher';
import { HeroBackground } from './components/HeroBackground';
import { PrintCV } from './components/PrintCV';
import { CVEditor, type EditorTab } from './components/editor/CVEditor';
import { runAtsCheck } from './cv/atsCheck';
import { Button } from './components/ui/button';
import { useCV } from './cv/useCV';
import { displayUrl, hrefUrl, toJsonLd } from './cv/format';
import { I18nProvider, fmt, useI18n } from './i18n';

const headingFont = { fontFamily: "'Space Grotesk', sans-serif" };
const sectionTitle = 'text-sm font-semibold text-zinc-900 dark:text-white uppercase tracking-wider';

export default function App() {
  return (
    <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
      <I18nProvider>
        {/* Respect the OS "reduce motion" setting for every entrance animation. */}
        <MotionConfig reducedMotion="user">
          <TooltipProvider>
            <CVPage />
          </TooltipProvider>
        </MotionConfig>
      </I18nProvider>
    </ThemeProvider>
  );
}

function AppLogo() {
  const { m } = useI18n();
  return (
    <a
      href="#main"
      aria-label={m.app.home}
      className="flex items-center gap-2 rounded-md focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-blue-600"
    >
      <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-zinc-900 text-white shadow-sm ring-4 ring-zinc-100 dark:bg-white dark:text-zinc-900 dark:ring-zinc-800">
        <Route size={18} strokeWidth={2.25} aria-hidden="true" />
      </span>
      <span className="hidden sm:inline text-sm font-bold tracking-tight text-zinc-900 dark:text-zinc-100" style={headingFont} aria-hidden="true">
        {m.app.name}
        <span className="text-zinc-600 dark:text-zinc-400">.CV</span>
      </span>
    </a>
  );
}

function CVPage() {
  const { cv, setCV, update } = useCV();
  const { m, locale } = useI18n();
  const [editing, setEditing] = useState(false);
  const [editorTab, setEditorTab] = useState<EditorTab>('profile');
  const atsScore = useMemo(() => runAtsCheck(cv, locale).score, [cv, locale]);
  const atsTone =
    atsScore >= 85
      ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/50 dark:text-emerald-200'
      : atsScore >= 65
        ? 'bg-amber-100 text-amber-900 dark:bg-amber-900/40 dark:text-amber-200'
        : 'bg-red-100 text-red-800 dark:bg-red-900/40 dark:text-red-200';
  const atsOpen = editing && editorTab === 'ats';
  const toggleAts = () => {
    if (atsOpen) setEditing(false);
    else {
      setEditorTab('ats');
      setEditing(true);
    }
  };
  const { profile } = cv;
  const name = profile.name || m.app.namePlaceholder;
  const headline = profile.headline || m.app.headlinePlaceholder;

  // Document title doubles as the default PDF file name when printing.
  useEffect(() => {
    document.title = [profile.name, profile.headline, m.app.cvTitle].filter(Boolean).join(' - ');
  }, [profile.name, profile.headline, m.app.cvTitle]);

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
          title: `${name} - ${m.app.cvTitle}`,
          text: fmt(m.app.shareText, { name }),
          url: window.location.href,
        });
      } catch (err) {
        console.error('Error sharing:', err);
      }
    } else {
      navigator.clipboard.writeText(window.location.href);
      toast.success(m.app.linkCopied);
    }
  };

  const handleDownload = () => {
    toast(m.app.pdfToastTitle, { description: m.app.pdfToastBody });
    // Let the toast render before the print dialog blocks the page.
    setTimeout(() => window.print(), 300);
  };

  const contacts = [
    profile.email && { icon: Mail, kind: m.contact.email, label: profile.email, href: `mailto:${profile.email}` },
    profile.phone && { icon: Phone, kind: m.contact.phone, label: profile.phone, href: `tel:${profile.phone.replace(/[^\d+]/g, '')}` },
    profile.location && { icon: MapPin, kind: m.contact.location, label: profile.location },
    profile.linkedin && { icon: Linkedin, kind: m.contact.linkedin, label: displayUrl(profile.linkedin), href: hrefUrl(profile.linkedin) },
    profile.website && { icon: Globe, kind: m.contact.website, label: displayUrl(profile.website), href: hrefUrl(profile.website) },
  ].filter(Boolean) as { icon: LucideIcon; kind: string; label: string; href?: string }[];

  return (
    <div className="min-h-screen bg-white dark:bg-zinc-950 text-zinc-900 dark:text-zinc-50 transition-colors duration-300 font-sans selection:bg-blue-500/20 print:bg-white print:min-h-0" style={{ fontFamily: "'Manrope', sans-serif" }}>
      <a
        href="#main"
        className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-3 focus:z-[100] focus:rounded-md focus:bg-zinc-900 focus:px-4 focus:py-2 focus:text-sm focus:font-medium focus:text-white dark:focus:bg-white dark:focus:text-zinc-900 print:hidden"
      >
        {m.app.skipToContent}
      </a>
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
          <nav aria-label={m.app.home} className="max-w-3xl mx-auto px-4 sm:px-6 h-16 flex justify-between items-center gap-2">
            <AppLogo />
            <div className="flex items-center gap-1 sm:gap-2">
              <Button
                variant="ghost"
                size="sm"
                onClick={handleShare}
                className="hidden md:flex gap-2 text-zinc-600 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-100"
              >
                <Share2 size={16} aria-hidden="true" />
                {m.app.share}
              </Button>
              <Button
                variant={atsOpen ? 'secondary' : 'ghost'}
                size="sm"
                onClick={toggleAts}
                aria-pressed={atsOpen}
                aria-label={`${m.editor.tabs.ats}: ${atsScore}/100`}
                title={`${m.ats.readiness}: ${atsScore}/100`}
                className="gap-2 text-xs h-9 px-2 sm:px-3"
              >
                <Gauge size={16} aria-hidden="true" />
                <span className="hidden lg:inline">{m.editor.tabs.ats}</span>
                <span className={`rounded-full px-1.5 py-0.5 text-[11px] font-semibold tabular-nums leading-none ${atsTone}`} aria-hidden="true">
                  {atsScore}
                </span>
              </Button>
              <Button
                variant={editing && !atsOpen ? 'secondary' : 'ghost'}
                size="sm"
                onClick={() => {
                  if (editing && !atsOpen) setEditing(false);
                  else {
                    if (editorTab === 'ats') setEditorTab('profile');
                    setEditing(true);
                  }
                }}
                aria-pressed={editing && !atsOpen}
                aria-label={m.app.edit}
                className="gap-2 text-xs h-9"
              >
                <PencilLine size={16} aria-hidden="true" />
                <span className="hidden sm:inline">{m.app.edit}</span>
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={handleDownload}
                aria-label={m.app.downloadPdf}
                className="gap-2 text-xs h-9"
              >
                <Download size={16} aria-hidden="true" />
                <span className="hidden sm:inline">{m.app.downloadPdf}</span>
              </Button>
              <LanguageSwitcher />
              <ThemeToggle />
            </div>
          </nav>
        </header>

        <div className="relative">
          <HeroBackground />

          {/* Main Layout */}
          {/* Single column in standard ATS order: contact, summary, skills, experience, education, certifications, languages */}
          <main id="main" tabIndex={-1} className="max-w-3xl mx-auto px-4 sm:px-6 py-12 md:py-20 space-y-14 focus:outline-none">

            {/* Name + contact block */}
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
              className="space-y-4"
            >
              <div>
                <h1 className="text-4xl sm:text-5xl font-bold tracking-tight text-zinc-900 dark:text-white" style={headingFont}>
                  {name}
                </h1>
                <p className="mt-1 text-lg text-zinc-600 dark:text-zinc-400 font-medium">
                  {headline}
                </p>
              </div>

              <address className="not-italic">
                <ul className="flex flex-wrap gap-x-5 gap-y-2 text-sm text-zinc-600 dark:text-zinc-400">
                  {contacts.map(({ icon: Icon, kind, label, href }) => {
                    const content = (
                      <>
                        <Icon size={16} aria-hidden="true" className="shrink-0" />
                        <span className="sr-only">{kind}: </span>
                        <span className="break-all">{label}</span>
                      </>
                    );
                    return (
                      <li key={kind}>
                        {href ? (
                          <a
                            href={href}
                            target={href.startsWith('http') ? '_blank' : undefined}
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-2 rounded-sm hover:text-blue-700 dark:hover:text-blue-400 underline-offset-4 hover:underline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600 transition-colors"
                          >
                            {content}
                          </a>
                        ) : (
                          <span className="inline-flex items-center gap-2">{content}</span>
                        )}
                      </li>
                    );
                  })}
                </ul>
              </address>
            </motion.div>

            {cv.summary.trim() && (
              <section aria-labelledby="summary-heading">
                <h2 id="summary-heading" className={`${sectionTitle} mb-4`} style={headingFont}>{m.sections.summary}</h2>
                <p className="text-[15px] leading-relaxed text-zinc-700 dark:text-zinc-300 whitespace-pre-line">
                  {cv.summary}
                </p>
              </section>
            )}

            {(cv.skills.length > 0 || cv.tools.length > 0) && (
              <section aria-labelledby="skills-heading" className="space-y-6">
                <h2 id="skills-heading" className={`${sectionTitle} flex items-center gap-2`} style={headingFont}>
                  <Zap size={16} className="text-zinc-500" aria-hidden="true" />
                  {m.sections.skills}
                </h2>
                {cv.skills.length > 0 && (
                  <div>
                    <h3 className="mb-3 text-xs font-medium text-zinc-600 dark:text-zinc-400">{m.sections.coreSkills}</h3>
                    <ul className="flex flex-wrap gap-x-2 gap-y-1.5 text-sm text-zinc-700 dark:text-zinc-300">
                      {cv.skills.map((s) => (
                        <li key={s} className="rounded-full border border-zinc-300 dark:border-zinc-700 px-2.5 py-0.5">{s}</li>
                      ))}
                    </ul>
                  </div>
                )}
                {cv.tools.length > 0 && (
                  <div>
                    <h3 className="mb-3 text-xs font-medium text-zinc-600 dark:text-zinc-400">{m.sections.tools}</h3>
                    <ul className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
                      {cv.tools.map((tool) => (
                        <ToolBadge key={tool.id} icon={tool.icon} name={tool.name} description={tool.description} />
                      ))}
                    </ul>
                  </div>
                )}
              </section>
            )}

            <section aria-labelledby="experience-heading">
              <h2 id="experience-heading" className={`${sectionTitle} mb-6 flex items-center gap-2`} style={headingFont}>
                <Briefcase size={16} className="text-zinc-500" aria-hidden="true" />
                {m.sections.experience}
              </h2>
              <div className="space-y-4">
                {cv.experience.map((exp, index) => (
                  <ExperienceCard key={exp.id} {...exp} index={index} />
                ))}
                {cv.experience.length === 0 && (
                  <button
                    type="button"
                    onClick={() => setEditing(true)}
                    className="w-full rounded-lg border border-dashed border-zinc-300 dark:border-zinc-700 p-8 text-sm text-zinc-600 dark:text-zinc-400 hover:border-zinc-400 focus-visible:outline-2 focus-visible:outline-blue-600"
                  >
                    {m.app.addFirstRole}
                  </button>
                )}
              </div>
            </section>

            {cv.education.length > 0 && (
              <section aria-labelledby="education-heading">
                <h2 id="education-heading" className={`${sectionTitle} mb-4 flex items-center gap-2`} style={headingFont}>
                  <GraduationCap size={16} className="text-zinc-500" aria-hidden="true" />
                  {m.sections.education}
                </h2>
                <ul className="grid grid-cols-1 sm:grid-cols-2 gap-3">
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
                </ul>
              </section>
            )}

            {cv.certifications.length > 0 && (
              <section aria-labelledby="certifications-heading">
                <h2 id="certifications-heading" className={`${sectionTitle} mb-4 flex items-center gap-2`} style={headingFont}>
                  <Award size={16} className="text-zinc-500" aria-hidden="true" />
                  {m.sections.certifications}
                </h2>
                <ul className="grid grid-cols-1 sm:grid-cols-2 gap-3">
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
                </ul>
              </section>
            )}

            {cv.languages.length > 0 && (
              <section aria-labelledby="languages-heading">
                <h2 id="languages-heading" className={`${sectionTitle} mb-4 flex items-center gap-2`} style={headingFont}>
                  <Languages size={16} className="text-zinc-500" aria-hidden="true" />
                  {m.sections.languages}
                </h2>
                <dl className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-sm">
                  {cv.languages.map((l) => (
                    <div key={l.id} className="rounded-lg border border-zinc-200 dark:border-zinc-800 px-4 py-3">
                      <dt className="font-medium text-zinc-900 dark:text-zinc-100">{l.name}</dt>
                      <dd className="text-zinc-600 dark:text-zinc-400">{l.level}</dd>
                    </div>
                  ))}
                </dl>
              </section>
            )}
          </main>

          {/* Footer */}
          <footer className="border-t border-zinc-200 dark:border-zinc-800 py-12 text-center">
            <div className="max-w-3xl mx-auto px-4 sm:px-6 flex flex-col md:flex-row justify-between items-center gap-6 text-sm text-zinc-600 dark:text-zinc-400">
              <p>© {new Date().getFullYear()} {name}. {m.app.rights}</p>
              {profile.email && (
                <a href={`mailto:${profile.email}`} className="rounded-sm hover:text-zinc-900 dark:hover:text-zinc-200 underline-offset-4 hover:underline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600 transition-colors">{m.app.contact}</a>
              )}
            </div>
          </footer>
        </div>
      </div>

      <CVEditor open={editing} onOpenChange={setEditing} cv={cv} setCV={setCV} update={update} tab={editorTab} onTabChange={setEditorTab} />
    </div>
  );
}
