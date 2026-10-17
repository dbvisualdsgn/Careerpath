import { useEffect, useMemo, useState } from 'react';
import { Mail, Share2, Download, Phone, MapPin, Linkedin, PencilLine, Eye, Loader2, Globe, ArrowLeft } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import { ThemeProvider } from 'next-themes';
import { Toaster, toast } from 'sonner';
import { TooltipProvider } from './components/ui/tooltip';
import { ToolBadge } from './components/ToolBadge';
import { ExperienceCard } from './components/ExperienceCard';
import { CertificationCard } from './components/CertificationCard';
import { ThemeToggle } from './components/ThemeToggle';
import { LanguageSwitcher } from './components/LanguageSwitcher';
import { TypeSwitcher } from './components/TypeSwitcher';
import { Wordmark } from './components/Wordmark';
import { PrintCV } from './components/PrintCV';
import { CVEditor, type EditorTab } from './components/editor/CVEditor';
import { runAtsCheck } from './cv/atsCheck';
import { useCV } from './cv/useCV';
import { displayUrl, fileSlug, hrefUrl, toJsonLd } from './cv/format';
import { buildPdf } from './cv/pdf';
import { saveFile } from './cv/save';
import { clearShareHash, readSharedCV } from './cv/share';
import { blankCV, sampleCV } from './cv/defaultCV';
import { ShareDialog } from './components/ShareDialog';
import type { CVData } from './cv/types';
import { I18nProvider, useI18n } from './i18n';

// Read before the first render, because useCV saves the sample as soon as it mounts.
const hadSavedCV = (() => {
  try {
    return localStorage.getItem('careerpath.cv.v1') !== null;
  } catch {
    return false;
  }
})();

const microLabel = 'font-mono text-[11px] uppercase tracking-[0.14em] text-ink-soft';
const headerBtn =
  'inline-flex h-9 items-center gap-2 rounded-sm px-2 text-[13px] text-ink hover:bg-zinc-100 disabled:opacity-60 dark:hover:bg-zinc-800 sm:px-3';

export default function App() {
  return (
    <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
      <I18nProvider>
        <TooltipProvider>
          <CVPage />
        </TooltipProvider>
      </I18nProvider>
    </ThemeProvider>
  );
}

/** Swiss-style section opener: hairline rule, small mono title, running number. */
function SectionHead({ id, title, n }: { id: string; title: string; n: number }) {
  return (
    <div className="mb-6 flex items-baseline justify-between border-t border-ink pt-3">
      <h2 id={id} className="font-mono text-[12px] font-medium uppercase tracking-[0.14em] text-ink">{title}</h2>
      <span className="font-mono text-[11px] text-ink-soft" aria-hidden="true">{String(n).padStart(2, '0')}</span>
    </div>
  );
}

/** ATS score as a monochrome mark: dashed (needs work), outlined (good), filled (strong). */
function ScoreMark({ score }: { score: number }) {
  const tone =
    score >= 85 ? 'bg-ink text-paper border-ink' : score >= 65 ? 'border-ink text-ink' : 'border-dashed border-ink text-ink';
  return (
    <span className={`inline-flex min-w-8 justify-center rounded-sm border px-1 py-0.5 font-mono text-[11px] font-semibold tabular-nums leading-none ${tone}`} aria-hidden="true">
      {score}
    </span>
  );
}

function CVPage() {
  const { cv: ownCV, setCV, update } = useCV();
  const { m, locale } = useI18n();
  // A CV opened from a share link (#cv=…) is shown read-only and never overwrites the visitor's own CV.
  const [sharedCV, setSharedCV] = useState<CVData | null>(null);
  const [isExample, setIsExample] = useState(false);
  const cv = sharedCV ?? ownCV;
  const [shareOpen, setShareOpen] = useState(false);
  const [pdfBusy, setPdfBusy] = useState(false);
  const [editing, setEditing] = useState(false);
  const [editorTab, setEditorTab] = useState<EditorTab>('profile');

  useEffect(() => {
    const load = () =>
      readSharedCV(window.location.hash)
        // No #cv= in the URL: leave any CV already on screen (e.g. the example) alone.
        .then((shared) => shared && setSharedCV(shared))
        .catch(() => {
          setSharedCV(null);
          toast.error(m.shared.loadError);
        });
    load();
    window.addEventListener('hashchange', load);
    return () => window.removeEventListener('hashchange', load);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const leaveShared = (next: CVData, openEditor: boolean) => {
    setCV(structuredClone(next));
    setSharedCV(null);
    setIsExample(false);
    clearShareHash();
    if (openEditor) {
      setEditorTab('profile');
      setEditing(true);
    }
  };
  // Entry points from the homepage: ?new=1 (start writing) and ?example=1 (read the sample).
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (!params.has('new') && !params.has('example')) return;
    if (params.has('example')) {
      setSharedCV(structuredClone(sampleCV));
      setIsExample(true);
    }
    if (params.has('new')) {
      if (!hadSavedCV) setCV(structuredClone(blankCV));
      setEditorTab('profile');
      setEditing(true);
    }
    history.replaceState(null, '', `${window.location.pathname}${window.location.hash}`);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const atsScore = useMemo(() => runAtsCheck(cv, locale).score, [cv, locale]);
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

  const handleDownload = async () => {
    setPdfBusy(true);
    try {
      const pdf = await buildPdf(cv, m);
      const outcome = await saveFile(`${fileSlug(cv.profile.name)}_CV.pdf`, pdf, 'application/pdf');
      if (outcome === 'saved') toast.success(m.app.pdfSaved);
      else if (outcome === 'failed') toast.error(m.app.pdfError);
    } catch {
      toast.error(m.app.pdfError);
    } finally {
      setPdfBusy(false);
    }
  };

  const contacts = [
    profile.email && { icon: Mail, kind: m.contact.email, label: profile.email, href: `mailto:${profile.email}` },
    profile.phone && { icon: Phone, kind: m.contact.phone, label: profile.phone, href: `tel:${profile.phone.replace(/[^\d+]/g, '')}` },
    profile.location && { icon: MapPin, kind: m.contact.location, label: profile.location },
    profile.linkedin && { icon: Linkedin, kind: m.contact.linkedin, label: displayUrl(profile.linkedin), href: hrefUrl(profile.linkedin) },
    profile.website && { icon: Globe, kind: m.contact.website, label: displayUrl(profile.website), href: hrefUrl(profile.website) },
  ].filter(Boolean) as { icon: LucideIcon; kind: string; label: string; href?: string }[];

  return (
    <div className="min-h-screen bg-paper text-ink print:bg-white print:min-h-0">
      <a
        href="#main"
        className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-3 focus:z-[100] focus:rounded-sm focus:bg-ink focus:px-4 focus:py-2 focus:text-sm focus:text-paper print:hidden"
      >
        {m.app.skipToContent}
      </a>
      <Toaster className="print:hidden" toastOptions={{ className: 'rounded-sm border-ink bg-paper text-ink' }} />

      <style>{`
        @media print {
          @page { margin: 14mm 16mm; }
          body { background: white !important; }
        }
      `}</style>

      {/* ATS-friendly single-column version, shown only when printing / saving as PDF */}
      <PrintCV cv={cv} />

      <div className={`print:hidden ${editing ? 'lg:pr-[480px]' : ''}`}>
        <header className="sticky top-0 z-40 w-full border-b border-rule bg-paper">
          <nav aria-label={m.app.home} className="mx-auto flex h-16 max-w-4xl items-center justify-between gap-2 px-4 sm:px-6">
            <div className="flex items-center gap-1">
              <a href="../" aria-label={m.app.home} className="hidden h-9 w-9 items-center justify-center rounded-sm hover:bg-zinc-100 dark:hover:bg-zinc-800 md:inline-flex">
                <ArrowLeft size={18} aria-hidden="true" />
              </a>
              <Wordmark href="../" compact />
            </div>
            <div className="flex items-center gap-0.5 sm:gap-1">
              <button type="button" onClick={() => setShareOpen(true)} aria-label={m.app.share} className={headerBtn}>
                <Share2 size={16} aria-hidden="true" />
                <span className="hidden md:inline">{m.app.share}</span>
              </button>
              {!sharedCV && (
                <>
                  <button
                    type="button"
                    onClick={toggleAts}
                    aria-pressed={atsOpen}
                    aria-label={`${m.editor.tabs.ats}: ${atsScore}/100`}
                    title={`${m.ats.readiness}: ${atsScore}/100`}
                    className={`${headerBtn} ${atsOpen ? 'bg-zinc-100 dark:bg-zinc-800' : ''}`}
                  >
                    <span className="hidden lg:inline">{m.editor.tabs.ats}</span>
                    <ScoreMark score={atsScore} />
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      if (editing && !atsOpen) setEditing(false);
                      else {
                        if (editorTab === 'ats') setEditorTab('profile');
                        setEditing(true);
                      }
                    }}
                    aria-pressed={editing && !atsOpen}
                    aria-label={m.app.edit}
                    className={`${headerBtn} ${editing && !atsOpen ? 'bg-zinc-100 dark:bg-zinc-800' : ''}`}
                  >
                    <PencilLine size={16} aria-hidden="true" />
                    <span className="hidden sm:inline">{m.app.edit}</span>
                  </button>
                </>
              )}
              <button
                type="button"
                onClick={handleDownload}
                disabled={pdfBusy}
                aria-busy={pdfBusy}
                aria-label={m.app.downloadPdf}
                className="inline-flex h-9 items-center gap-2 rounded-sm border border-ink px-2 text-[13px] text-ink hover:bg-ink hover:text-paper disabled:opacity-60 sm:px-3"
              >
                {pdfBusy ? <Loader2 size={16} className="animate-spin motion-reduce:animate-none" aria-hidden="true" /> : <Download size={16} aria-hidden="true" />}
                <span className="hidden sm:inline">{m.app.downloadPdf}</span>
              </button>
              <TypeSwitcher />
              <LanguageSwitcher />
              <ThemeToggle />
            </div>
          </nav>
        </header>

        {sharedCV && (
          <div role="region" aria-label={isExample ? m.shared.example : m.shared.banner} className="bg-ink text-paper">
            <div className="mx-auto flex max-w-4xl flex-col justify-between gap-3 px-4 py-3 sm:flex-row sm:items-center sm:px-6">
              <p className="flex items-center gap-2 text-sm">
                <Eye size={16} aria-hidden="true" className="shrink-0" />
                {isExample ? m.shared.example : m.shared.banner}
              </p>
              <div className="flex gap-2">
                <button type="button" className="h-8 rounded-sm border border-paper px-3 text-xs hover:bg-paper hover:text-ink" onClick={() => leaveShared(sharedCV, true)}>
                  {m.shared.makeCopy}
                </button>
                <button type="button" className="h-8 rounded-sm bg-paper px-3 text-xs text-ink hover:opacity-90" onClick={() => leaveShared(blankCV, true)}>
                  {m.shared.createOwn}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* One column in standard ATS order: contact, summary, skills, experience, education, certifications, languages */}
        <main id="main" tabIndex={-1} className="mx-auto max-w-4xl space-y-16 px-4 py-14 font-reading focus:outline-none sm:px-6 md:py-20">
          <div>
            <p className={microLabel}>{m.app.cvTitle}</p>
            <h1 className="mt-4 text-[clamp(2.75rem,8vw,5.5rem)] font-normal leading-[0.92] tracking-[-0.035em]">{name}</h1>
            <p className="mt-4 text-xl text-ink-soft md:text-2xl">{headline}</p>
            <address className="mt-8 not-italic">
              <ul className="flex flex-wrap gap-x-6 gap-y-2 font-sans text-[14px] text-ink-soft">
                {contacts.map(({ icon: Icon, kind, label, href }) => {
                  const content = (
                    <>
                      <Icon size={15} aria-hidden="true" className="shrink-0" />
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
                          className="inline-flex items-center gap-2 rounded-sm underline decoration-rule underline-offset-4 hover:text-ink hover:decoration-ink"
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
          </div>

          {cv.summary.trim() && (
            <section aria-labelledby="summary-heading">
              <SectionHead id="summary-heading" title={m.sections.summary} n={1} />
              <p className="max-w-[60ch] whitespace-pre-line text-lg leading-relaxed md:text-xl">{cv.summary}</p>
            </section>
          )}

          {(cv.skills.length > 0 || cv.tools.length > 0) && (
            <section aria-labelledby="skills-heading" className="space-y-8">
              <SectionHead id="skills-heading" title={m.sections.skills} n={2} />
              {cv.skills.length > 0 && (
                <div>
                  <h3 className={`${microLabel} mb-3`}>{m.sections.coreSkills}</h3>
                  <ul className="flex flex-wrap gap-2 text-[15px]">
                    {cv.skills.map((s) => (
                      <li key={s} className="rounded-sm border border-ink px-2.5 py-1">{s}</li>
                    ))}
                  </ul>
                </div>
              )}
              {cv.tools.length > 0 && (
                <div>
                  <h3 className={`${microLabel} mb-3`}>{m.sections.tools}</h3>
                  <ul className="grid grid-cols-1 gap-px border border-rule bg-rule sm:grid-cols-2 lg:grid-cols-3">
                    {cv.tools.map((tool) => (
                      <ToolBadge key={tool.id} icon={tool.icon} name={tool.name} description={tool.description} />
                    ))}
                  </ul>
                </div>
              )}
            </section>
          )}

          <section aria-labelledby="experience-heading">
            <SectionHead id="experience-heading" title={m.sections.experience} n={3} />
            <div className="border-b border-rule">
              {cv.experience.map((exp, index) => (
                <ExperienceCard key={exp.id} {...exp} index={index} />
              ))}
            </div>
            {cv.experience.length === 0 && (
              <button
                type="button"
                onClick={() => {
                  setEditorTab('experience');
                  setEditing(true);
                }}
                className="w-full rounded-sm border border-dashed border-ink p-8 font-sans text-sm hover:bg-zinc-100 dark:hover:bg-zinc-800"
              >
                {m.app.addFirstRole}
              </button>
            )}
          </section>

          {cv.education.length > 0 && (
            <section aria-labelledby="education-heading">
              <SectionHead id="education-heading" title={m.sections.education} n={4} />
              <ul className="border-b border-rule">
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
              <SectionHead id="certifications-heading" title={m.sections.certifications} n={5} />
              <ul className="border-b border-rule">
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
              <SectionHead id="languages-heading" title={m.sections.languages} n={6} />
              <dl className="grid grid-cols-1 gap-px border border-rule bg-rule sm:grid-cols-3">
                {cv.languages.map((l) => (
                  <div key={l.id} className="bg-paper px-4 py-4">
                    <dt className="text-xl">{l.name}</dt>
                    <dd className="mt-1 font-mono text-[12px] uppercase tracking-[0.1em] text-ink-soft">{l.level}</dd>
                  </div>
                ))}
              </dl>
            </section>
          )}
        </main>

        <footer className="border-t border-ink">
          <div className="mx-auto flex max-w-4xl flex-col justify-between gap-4 px-4 py-10 text-sm text-ink-soft sm:flex-row sm:items-center sm:px-6">
            <Wordmark href="../" />
            <p>© {new Date().getFullYear()} {name}</p>
            {profile.email && (
              <a href={`mailto:${profile.email}`} className="rounded-sm underline underline-offset-4 hover:text-ink">{m.app.contact}</a>
            )}
          </div>
        </footer>
      </div>

      <ShareDialog open={shareOpen} onOpenChange={setShareOpen} cv={cv} />
      <CVEditor open={editing && !sharedCV} onOpenChange={setEditing} cv={ownCV} setCV={setCV} update={update} tab={editorTab} onTabChange={setEditorTab} />
    </div>
  );
}
