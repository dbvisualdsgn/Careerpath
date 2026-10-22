import { ReadingControls } from './components/ReadingControls';
import { useEffect, useMemo, useRef, useState } from 'react';
import { Mail, Share2, Phone, MapPin, Linkedin, PencilLine, Eye, Globe, Loader2, Lock, ScanEye } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import { Toaster, toast } from 'sonner';
import { TooltipProvider } from './components/ui/tooltip';
import { ToolBadge } from './components/ToolBadge';
import { ExperienceCard } from './components/ExperienceCard';
import { CertificationCard } from './components/CertificationCard';
import { Wordmark } from './components/Wordmark';
import { PrintCV } from './components/PrintCV';
import { CVEditor, sectionTab, type EditorTab } from './components/editor/CVEditor';
import { runAtsCheck, type Finding } from './cv/atsCheck';
import { useJobAd } from './cv/jobAd';
import { hasSavedCV, useLibrary } from './cv/library';
import { LibraryMenu } from './components/LibraryMenu';
import { avatarOf, displayUrl, hrefUrl, toJsonLd } from './cv/format';
import { DownloadMenu } from './components/DownloadMenu';
import { AtsSummary } from './components/AtsSummary';
import { DeleteCVDialog } from './components/DeleteCVDialog';
import { AtsPanel } from './components/editor/AtsPanel';
import { BeyondNote, beyondNoteWanted } from './components/BeyondNote';
import { PrivacySwitch } from './components/PrivacySwitch';
import { Portrait } from './components/Portrait';
import { findPerson } from './cv/people';
import { useReveal } from './hooks/useReveal';
import { clearShareHash, readSharedCV } from './cv/share';
import { blankCV } from './cv/defaultCV';
import { ShareDialog } from './components/ShareDialog';
import { PublishDialog } from './components/PublishDialog';
import { usePublishing } from './cv/usePublishing';
import { fetchPublicCV, isBackendReady, publicCVUrl } from './cv/backend';
import type { CVData } from './cv/types';
import { I18nProvider, fmt, useI18n } from './i18n';

// Read before the first render, because the library saves the sample as soon as it mounts.
const hadSavedCV = hasSavedCV();

const microLabel = 'font-mono text-[11px] uppercase tracking-[0.14em] text-ink-soft';
// CV menu buttons: icon, with a label from md up; 44px on phones. Pressed = ink fill (the shared button states).
const toolBtn =
  'inline-flex h-11 min-w-11 items-center justify-center gap-2 rounded-sm px-2 text-[13px] text-ink hover:bg-zinc-100 disabled:opacity-60 aria-pressed:bg-ink aria-pressed:text-paper md:h-9 md:min-w-9';
const toolLabel = 'hidden whitespace-nowrap md:inline';

export default function App() {
  return (
    <I18nProvider>
      <TooltipProvider>
        <CVPage />
      </TooltipProvider>
    </I18nProvider>
  );
}

/** A CV section that rises in once when scrolled into view. */
function RevealSection({ children, className = '', ...rest }: React.ComponentProps<'section'>) {
  const ref = useReveal<HTMLElement>(0.15);
  return (
    <section ref={ref} className={`reveal ${className}`} {...rest}>
      {children}
    </section>
  );
}

/** Swiss-style section opener: hairline rule and a small mono title. */
function SectionHead({ id, title }: { id: string; title: string }) {
  return (
    <div className="mb-5 border-t border-ink pt-3">
      <h2 id={id} className="font-mono text-[12px] font-medium uppercase tracking-[0.14em] text-ink">{title}</h2>
    </div>
  );
}

/** ATS score as a monochrome mark: dashed (needs work), outlined (good), filled (strong).
 *  On a pressed (ink) button it is drawn in paper, so the score stays readable. */
function ScoreMark({ score, onInk = false }: { score: number; onInk?: boolean }) {
  const tone = onInk
    ? score >= 85 ? 'bg-paper text-ink border-paper' : score >= 65 ? 'border-paper text-paper' : 'border-dashed border-paper text-paper'
    : score >= 85 ? 'bg-ink text-paper border-ink' : score >= 65 ? 'border-ink text-ink' : 'border-dashed border-ink text-ink';
  return (
    <span className={`inline-flex min-w-8 justify-center rounded-sm border px-1 py-0.5 font-mono text-[11px] font-semibold tabular-nums leading-none ${tone}`} aria-hidden="true">
      {score}
    </span>
  );
}

function CVPage() {
  const { cv: ownCV, setCV, update, items, activeId, versionName, publicMeta, setPublicMeta, create, duplicate, rename, select, remove } = useLibrary();
  const publishing = usePublishing({ cv: ownCV, meta: publicMeta, setMeta: setPublicMeta, update });
  const [publishOpen, setPublishOpen] = useState(false);
  const pdfRef = useRef<HTMLInputElement>(null);
  const { m, locale } = useI18n();
  // A CV opened from a share link (#cv=…) is shown read-only and never overwrites the visitor's own CV.
  const [sharedCV, setSharedCV] = useState<CVData | null>(null);
  const [banner, setBanner] = useState<'shared' | 'directory' | 'public'>('shared');
  // A public CV opened by its link (?id=…); ?embed=1 shows it compact, for iframes on other sites.
  const [publicId] = useState(() => new URLSearchParams(window.location.search).get('id'));
  const [embed] = useState(() => Boolean(publicId) && new URLSearchParams(window.location.search).has('embed'));
  const [remote, setRemote] = useState<'idle' | 'loading' | 'missing'>(publicId ? 'loading' : 'idle');
  const cv = sharedCV ?? ownCV;
  const [shareOpen, setShareOpen] = useState(false);
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

  useEffect(() => {
    if (!publicId) return;
    fetchPublicCV(publicId)
      .then((found) => {
        if (!found) return setRemote('missing');
        setSharedCV(found.cv);
        setBanner('public');
        setRemote('idle');
      })
      .catch(() => {
        setRemote('missing');
        toast.error(m.shared.loadError);
      });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [publicId]);

  /** The Public / Private switch: going public asks first; going private deletes the public copy. */
  const togglePublic = async (next: boolean) => {
    if (next) {
      if (isBackendReady()) setPublishOpen(true);
      else toast.error(m.share.notSetUp);
      return;
    }
    const ok = await publishing.makePrivate();
    if (ok) toast.success(m.publish.nowPrivate);
    else toast.error(m.publish.privateFailed);
  };

  const leaveShared = (next: CVData, openEditor: boolean) => {
    // Editing a copy or starting fresh adds a CV to the library; nothing the visitor had is overwritten.
    create(structuredClone(next));
    setSharedCV(null);
    setBanner('shared');
    clearShareHash();
    if (publicId) history.replaceState(null, '', window.location.pathname);
    setRemote('idle');
    if (openEditor) {
      setEditorTab('profile');
      setEditing(true);
    }
  };

  const importPdfFile = async (file: File | undefined) => {
    if (!file) return;
    const id = toast.loading(m.library.pdfReading);
    try {
      const { importPdf } = await import('./cv/importPdf');
      const { cv: imported, exact } = await importPdf(file);
      create(imported);
      setSharedCV(null);
      clearShareHash();
      setEditorTab('profile');
      setEditing(true);
      toast.success(exact ? m.library.pdfExact : m.library.pdfDone, { id });
    } catch (err) {
      toast.error((err as { code?: string })?.code === 'no-text' ? m.library.pdfNoText : m.library.pdfError, { id });
    }
  };
  // Entry points: ?new=1 (start writing) and ?person= (an example CV). Old ?example=1 links go to people/ (see app/index.html).
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (!params.has('new') && !params.has('person')) return;
    const person = params.get('person') && findPerson(params.get('person')!);
    if (person) {
      setSharedCV(structuredClone(person.cv));
      setBanner('directory');
      // A portrait ships as a file; the CV keeps images as data URLs, so read it in (the PDF needs it too).
      if (person.photo) {
        fetch(`../${person.photo}`)
          .then((r) => (r.ok ? r.blob() : Promise.reject(r.status)))
          .then((b) => new Promise<string>((done) => { const fr = new FileReader(); fr.onload = () => done(String(fr.result)); fr.readAsDataURL(b); }))
          .then((photo) => setSharedCV((c) => (c ? { ...c, profile: { ...c.profile, photo, avatar: 'photo' } } : c)))
          .catch(() => {});
      }
    }
    if (params.has('new')) {
      // First visit: the starting CV is replaced by a blank one. Returning visitor: add a new blank CV unless the open one is empty.
      if (!hadSavedCV) setCV(structuredClone(blankCV));
      else if (ownCV.profile.name || ownCV.experience.length) create(structuredClone(blankCV));
      setEditorTab('profile');
      setEditing(true);
    }
    history.replaceState(null, '', `${window.location.pathname}${window.location.hash}`);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // The job ad belongs to the person, so its title only counts for their own CV.
  const jobAd = useJobAd();
  const targetTitle = sharedCV ? undefined : jobAd.title;
  const atsScore = useMemo(() => runAtsCheck(cv, locale, { targetTitle }).score, [cv, locale, targetTitle]);
  const [skim, setSkim] = useState(false);
  const [skimTouched, setSkimTouched] = useState(false);
  // The recruiter check sits above the CV only while it is switched on in the CV menu.
  const [checkOpen, setCheckOpen] = useState(false);
  const [fullCheck, setFullCheck] = useState(false);
  const [jobAdRequest, setJobAdRequest] = useState(0);
  const [beyondOpen, setBeyondOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const openJobAd = () => {
    setFullCheck(true);
    setJobAdRequest((n) => n + 1);
  };
  const openSection = (section: Finding['section']) => {
    setEditorTab(sectionTab[section]);
    setEditing(true);
  };
  // A public CV is taken down before it is deleted, so no copy is left that nobody controls.
  const deleteOwn = async () => {
    if (publishing.isPublic && !(await publishing.makePrivate())) {
      toast.error(m.publish.privateFailed);
      return false;
    }
    remove(activeId);
    return true;
  };
  const { profile } = cv;
  const avatar = avatarOf(profile);
  const bannerText =
    banner === 'directory' ? m.directory.banner : banner === 'public' ? m.shared.publicBanner : m.shared.banner;
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
        {!embed && (
        <header className="sticky top-0 z-40 w-full border-b border-rule bg-paper">
          {/* Row 1: the site. Row 2: everything you can do with this CV. */}
          <nav aria-label={m.app.home} className="mx-auto flex h-14 max-w-5xl items-center justify-between gap-2 px-3 sm:px-6">
            <div className="flex min-w-0 items-center gap-1">
              <Wordmark href="../" />
              {!sharedCV && (
                <LibraryMenu
                  items={items}
                  activeId={activeId}
                  compact={editing}
                  onSelect={(id) => select(id)}
                  onNew={() => {
                    create();
                    setEditorTab('profile');
                    setEditing(true);
                    toast.success(m.library.created);
                  }}
                  onImportPdf={() => pdfRef.current?.click()}
                  onDelete={() => setDeleteOpen(true)}
                />
              )}
            </div>
            <a href="../people/" className="inline-flex h-11 shrink-0 items-center rounded-sm px-2 text-[13px] text-ink hover:bg-zinc-100 md:h-9">
              {m.directory.nav}
            </a>
          </nav>
          {/* Three groups: write and check · how the page reads · who gets it. Download is the one filled button. */}
          <div role="group" aria-label={m.app.cvActions} className="border-t border-rule">
            <div className="mx-auto flex max-w-5xl flex-wrap items-center justify-between gap-x-2 gap-y-1 px-3 py-1.5 sm:px-6">
              <div className="flex items-center gap-0.5">
                {!sharedCV && (
                  <>
                    <button type="button" onClick={() => setEditing((on) => !on)} aria-pressed={editing} className={toolBtn}>
                      <PencilLine size={20} aria-hidden="true" />
                      <span className="whitespace-nowrap md:hidden">{m.app.editShort}</span>
                      <span className={toolLabel}>{m.app.edit}</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setCheckOpen((on) => !on)}
                      aria-pressed={checkOpen}
                      aria-label={`${m.atsCard.title}: ${atsScore}/100`}
                      title={`${m.atsCard.title}: ${atsScore}/100`}
                      className={toolBtn}
                    >
                      <ScoreMark score={atsScore} onInk={checkOpen} />
                      <span className={toolLabel}>{m.atsCard.title}</span>
                    </button>
                  </>
                )}
              </div>
              <div className="order-last flex w-full items-center justify-between gap-1 border-t border-rule pt-1 md:order-none md:w-auto md:border-0 md:pt-0">
                {!sharedCV && (
                  <span className="md:hidden">
                    <PrivacySwitch isPublic={publishing.isPublic} busy={publishing.busy} onChange={togglePublic} />
                  </span>
                )}
                <ReadingControls>
                  <button
                    type="button"
                    onClick={() => {
                      setSkimTouched(true);
                      setSkim((on) => !on);
                    }}
                    aria-pressed={skim}
                    aria-label={m.skim.label}
                    aria-describedby="skim-hint"
                    title={m.skim.hint}
                    className={toolBtn}
                  >
                    <ScanEye size={20} aria-hidden="true" />
                  </button>
                </ReadingControls>
                <span id="skim-hint" className="sr-only">{m.skim.hint}</span>
                <span className="sr-only" role="status">{skim ? m.skim.on : skimTouched ? m.skim.off : ''}</span>
              </div>
              <div className="flex items-center gap-0.5">
                {!sharedCV && (
                  <span className="hidden md:inline">
                    <PrivacySwitch isPublic={publishing.isPublic} busy={publishing.busy} onChange={togglePublic} />
                  </span>
                )}
                <button type="button" onClick={() => setShareOpen(true)} aria-label={m.app.share} title={m.app.share} className={toolBtn}>
                  <Share2 size={20} aria-hidden="true" />
                  <span className={toolLabel} aria-hidden="true">{m.app.share}</span>
                </button>
                <DownloadMenu cv={cv} compact={editing} onDownloaded={() => beyondNoteWanted() && setBeyondOpen(true)} />
              </div>
            </div>
          </div>
          {/* A live region that is always there, so the note is announced when it appears. */}
          <div role="status">{beyondOpen && <BeyondNote onClose={() => setBeyondOpen(false)} />}</div>
        </header>
        )}

        {sharedCV && !embed && (
          <div role="region" aria-label={bannerText} className="bg-ink text-paper">
            <div className="mx-auto flex max-w-4xl flex-col justify-between gap-3 px-4 py-3 sm:flex-row sm:items-center sm:px-6">
              <p className="flex items-center gap-2 text-sm">
                <Eye size={20} aria-hidden="true" className="shrink-0" />
                {bannerText}
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

        {!sharedCV && !publicId && checkOpen && (
          <aside aria-label={m.atsCard.title} className="mx-auto max-w-5xl px-3 pt-6 sm:px-6 md:pt-8">
            <AtsSummary cv={cv} targetTitle={targetTitle} onJobAd={openJobAd} onOpen={openSection} fullOpen={fullCheck} onToggleFull={() => setFullCheck((on) => !on)} />
            {fullCheck && (
              <div id="ats-full" className="border border-t-0 border-ink bg-paper p-5 md:p-7">
                <AtsPanel
                  cv={ownCV}
                  focusJobAd={jobAdRequest}
                  onJump={openSection}
                  onSetHeadline={(headline) => update((d) => ({ ...d, profile: { ...d.profile, headline } }))}
                  onAddSkill={(skill) =>
                    update((d) => (d.skills.some((k) => k.toLowerCase() === skill.toLowerCase()) ? d : { ...d, skills: [...d.skills, skill] }))
                  }
                />
              </div>
            )}
          </aside>
        )}

        {remote !== 'idle' ? (
          <main id="main" tabIndex={-1} className="mx-auto max-w-4xl px-4 py-24 focus:outline-none sm:px-6" aria-busy={remote === 'loading'}>
            {remote === 'loading' ? (
              <p className="flex items-center gap-2 text-ink-soft" role="status">
                <Loader2 size={20} aria-hidden="true" className="animate-spin motion-reduce:animate-none" />
                {m.shared.loading}
              </p>
            ) : (
              <div className="max-w-[40ch]">
                <Lock size={20} aria-hidden="true" />
                <h1 className="mt-6 font-title text-4xl md:text-5xl">{m.shared.missingTitle}</h1>
                <p className="mt-4 font-body text-lg text-ink-soft">{m.shared.missingBody}</p>
                {!embed && (
                  <a href="../" className="mt-8 inline-flex h-11 items-center gap-2 rounded-sm bg-ink px-4 text-[14px] font-medium text-paper hover:opacity-90">
                    {m.shared.createOwn}
                  </a>
                )}
              </div>
            )}
          </main>
        ) : (
        <main
          id="main"
          tabIndex={-1}
          data-skim={skim ? '' : undefined}
          className="mx-auto max-w-5xl px-3 py-6 font-body focus:outline-none sm:px-6 md:py-12 print:p-0"
        >
          {/* The sheet: one page of paper on the desk. */}
          <div className="space-y-10 border border-rule bg-panel px-5 py-8 shadow-[0_1px_0_var(--rule),0_12px_32px_-18px_rgb(0_0_0/0.25)] sm:px-10 md:space-y-12 md:px-14 md:py-14 print:space-y-8 print:border-0 print:bg-transparent print:p-0 print:shadow-none">
          <div className="grid items-start gap-6 sm:grid-cols-[minmax(0,10rem)_minmax(0,1fr)] sm:gap-8 md:grid-cols-[minmax(0,13rem)_minmax(0,1fr)] md:gap-10">
            {avatar !== 'none' && (
              <Portrait
                skimKeep
                photo={avatar === 'photo' ? profile.photo : undefined}
                name={name}
                alt={fmt(m.photo.alt, { name })}
                className="aspect-square w-32 text-[3.5rem] sm:w-full md:text-[5rem]"
              />
            )}
            <div className={`min-w-0 ${avatar === 'none' ? 'sm:col-span-2' : ''}`}>
                <p className={microLabel}>{m.app.cvTitle}</p>
                <h1 data-skim-keep className="mt-3 font-title text-[clamp(2.25rem,7vw,4.75rem)] hyphens-auto [overflow-wrap:anywhere] font-normal leading-[0.92] tracking-[-0.035em]">{name}</h1>
                <p data-skim-keep className="mt-3 font-title text-xl text-ink-soft md:text-2xl">{headline}</p>
            <address className="mt-6 not-italic">
              <ul className="flex flex-wrap gap-x-6 gap-y-2 font-sans text-[14px] text-ink-soft">
                {contacts.map(({ icon: Icon, kind, label, href }) => {
                  const content = (
                    <>
                      <Icon size={20} aria-hidden="true" className="shrink-0" />
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
          </div>


          {cv.summary.trim() && (
            <RevealSection aria-labelledby="summary-heading">
              <SectionHead id="summary-heading" title={m.sections.summary} />
              <div className="border border-rule bg-paper px-5 py-5 md:px-7 md:py-6 print:border-0 print:p-0">
                <p className="max-w-[64ch] whitespace-pre-line text-lg leading-relaxed">{cv.summary}</p>
              </div>
            </RevealSection>
          )}

          {(cv.skills.length > 0 || cv.tools.length > 0) && (
            <RevealSection aria-labelledby="skills-heading">
              <SectionHead id="skills-heading" title={m.sections.skills} />
              <div className="grid gap-8 md:grid-cols-2 md:gap-10">
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
                  <ul className="flex flex-wrap gap-2">
                    {cv.tools.map((tool) => (
                      <ToolBadge key={tool.id} icon={tool.icon} name={tool.name} description={tool.description} />
                    ))}
                  </ul>
                </div>
              )}
              </div>
            </RevealSection>
          )}

          <RevealSection aria-labelledby="experience-heading">
            <SectionHead id="experience-heading" title={m.sections.experience} />
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
          </RevealSection>

          {cv.education.length > 0 && (
            <RevealSection aria-labelledby="education-heading">
              <SectionHead id="education-heading" title={m.sections.education} />
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
            </RevealSection>
          )}

          {cv.certifications.length > 0 && (
            <RevealSection aria-labelledby="certifications-heading">
              <SectionHead id="certifications-heading" title={m.sections.certifications} />
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
            </RevealSection>
          )}

          {cv.languages.length > 0 && (
            <RevealSection aria-labelledby="languages-heading">
              <SectionHead id="languages-heading" title={m.sections.languages} />
              <dl className="grid grid-cols-1 border-l border-t border-rule sm:grid-cols-3">
                {cv.languages.map((l) => (
                  <div key={l.id} className="border-b border-r border-rule px-4 py-4">
                    <dt className="font-title text-xl">{l.name}</dt>
                    <dd className="mt-1 font-mono text-[12px] uppercase tracking-[0.1em] text-ink-soft">{l.level}</dd>
                  </div>
                ))}
              </dl>
            </RevealSection>
          )}
          </div>
        </main>
        )}

        {embed ? (
          <p className="mx-auto max-w-4xl px-4 pb-6 text-[12px] text-ink-soft sm:px-6">
            <a href={publicCVUrl(publicId!)} target="_blank" rel="noopener noreferrer" className="underline underline-offset-4 hover:text-ink">
              {m.shared.madeWith}
            </a>
          </p>
        ) : (
        <footer className="border-t border-ink">
          <div className="mx-auto flex max-w-4xl flex-col justify-between gap-4 px-4 py-10 text-sm text-ink-soft sm:flex-row sm:items-center sm:px-6">
            <Wordmark href="../" />
            <p>© {new Date().getFullYear()} {name}</p>
            {profile.email && (
              <a href={`mailto:${profile.email}`} className="rounded-sm underline underline-offset-4 hover:text-ink">{m.app.contact}</a>
            )}
          </div>
        </footer>
        )}
      </div>

      {sharedCV ? (
        <ShareDialog open={shareOpen} onOpenChange={setShareOpen} cv={cv} kind="viewing" url={window.location.href} />
      ) : (
        <ShareDialog
          open={shareOpen}
          onOpenChange={setShareOpen}
          cv={cv}
          kind="own"
          isPublic={publishing.isPublic}
          publicId={publicMeta.publicId}
          listed={Boolean(publicMeta.listed)}
          status={publishing.status}
          busy={publishing.busy}
          onMakePublic={() => {
            setShareOpen(false);
            setPublishOpen(true);
          }}
          onSetListed={async (listed) => {
            if (!(await publishing.setListed(listed))) toast.error(m.publish.failed);
          }}
        />
      )}
      {!sharedCV && (
        <DeleteCVDialog open={deleteOpen} onOpenChange={setDeleteOpen} name={ownCV.profile.name} isPublic={publishing.isPublic} onDelete={deleteOwn} />
      )}
      <PublishDialog
        open={publishOpen}
        onOpenChange={setPublishOpen}
        busy={publishing.busy}
        onConfirm={async (listed) => {
          const ok = await publishing.makePublic(listed);
          if (ok) {
            toast.success(m.publish.nowPublic);
            setShareOpen(true);
          }
          return ok;
        }}
      />
      <CVEditor
        open={editing && !sharedCV}
        onOpenChange={setEditing}
        cv={ownCV}
        setCV={setCV}
        update={update}
        versionName={versionName}
        onRenameVersion={rename}
        onSaveVersion={(name) => duplicate(name)}
        tab={editorTab}
        onTabChange={setEditorTab}
        onCreate={(next) => create(next)}
        onImportPdf={() => pdfRef.current?.click()}
      />
      <input
        ref={pdfRef}
        type="file"
        accept="application/pdf,.pdf"
        className="hidden"
        tabIndex={-1}
        aria-hidden="true"
        onChange={(ev) => {
          importPdfFile(ev.target.files?.[0]);
          ev.target.value = '';
        }}
      />
    </div>
  );
}
