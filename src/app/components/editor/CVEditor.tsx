import { cloneElement, isValidElement, useEffect, useId, useRef, useState } from 'react';
import { ArrowDown, ArrowUp, Camera, Copy, FileDown, FileUp, Plus, RotateCcw, Trash2, FilePlus2 } from 'lucide-react';
import { PrivacySwitch } from '../PrivacySwitch';
import { Portrait } from '../Portrait';
import { processPhoto } from '../../cv/photo';
import { toast } from 'sonner';
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from '../ui/sheet';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../ui/tabs';
import { Input } from '../ui/input';
import { Textarea } from '../ui/textarea';
import { Label } from '../ui/label';
import { Button } from '../ui/button';
import { IconPicker } from './IconPicker';
import { AtsPanel } from './AtsPanel';
import { blankCV, emptyItems, sampleCV } from '../../cv/defaultCV';
import { findIcon } from '../../cv/iconCatalog';
import { normalize } from '../../cv/useCV';
import { downloadFile, fileSlug, toPlainText } from '../../cv/format';
import { fmt, useI18n } from '../../i18n';
import type { CVData, ListKey, Profile } from '../../cv/types';
import type { Finding } from '../../cv/atsCheck';

interface CVEditorProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  cv: CVData;
  setCV: (cv: CVData) => void;
  update: (fn: (cv: CVData) => CVData) => void;
  /** Active tab, controlled by the page so the header's ATS button can open the check directly. */
  tab: EditorTab;
  onTabChange: (tab: EditorTab) => void;
}

export type EditorTab = 'profile' | 'skills' | 'experience' | 'more' | 'ats';
type Tab = EditorTab;
const sectionTab: Record<Finding['section'], Tab> = {
  profile: 'profile', summary: 'profile', skills: 'skills', experience: 'experience', education: 'more', extras: 'more',
};

/** Label + control + hint, wired together with ids so screen readers announce all three. */
function Field({ label, hint, children }: { label: string; hint?: string; children: React.ReactElement<Record<string, unknown>> }) {
  const id = useId();
  const hintId = `${id}-hint`;
  return (
    <div className="space-y-1.5">
      <Label htmlFor={id} className="text-xs text-zinc-700 dark:text-zinc-300">{label}</Label>
      {isValidElement(children) ? cloneElement(children, { id, 'aria-describedby': hint ? hintId : undefined }) : children}
      {hint && <p id={hintId} className="text-[11px] text-zinc-600 dark:text-zinc-400">{hint}</p>}
    </div>
  );
}

function ItemControls({ onUp, onDown, onRemove, label }: { onUp?: () => void; onDown?: () => void; onRemove: () => void; label: string }) {
  const { m } = useI18n();
  const up = fmt(m.editor.moveUp, { label });
  const down = fmt(m.editor.moveDown, { label });
  const remove = fmt(m.editor.remove, { label });
  return (
    <div className="flex shrink-0 items-center">
      <Button type="button" variant="ghost" size="icon" className="h-8 w-8" disabled={!onUp} onClick={onUp} title={up} aria-label={up}>
        <ArrowUp size={14} aria-hidden="true" />
      </Button>
      <Button type="button" variant="ghost" size="icon" className="h-8 w-8" disabled={!onDown} onClick={onDown} title={down} aria-label={down}>
        <ArrowDown size={14} aria-hidden="true" />
      </Button>
      <Button type="button" variant="ghost" size="icon" className="h-8 w-8 text-zinc-600 hover:text-ink dark:text-zinc-400" onClick={onRemove} title={remove} aria-label={remove}>
        <Trash2 size={14} aria-hidden="true" />
      </Button>
    </div>
  );
}

function SectionHeading({ title, onAdd, addLabel }: { title: string; onAdd?: () => void; addLabel?: string }) {
  return (
    <div className="flex items-center justify-between">
      <h3 className="text-xs font-semibold uppercase tracking-wider text-zinc-600 dark:text-zinc-400">{title}</h3>
      {onAdd && (
        <Button type="button" variant="outline" size="sm" className="h-8 gap-1" onClick={onAdd}>
          <Plus size={14} aria-hidden="true" /> {addLabel}
        </Button>
      )}
    </div>
  );
}

const parseSkills = (text: string) => text.split(/[\n,]/).map((s) => s.trim()).filter(Boolean);

const cardClass = 'rounded-lg border border-zinc-200 dark:border-zinc-800 p-4 space-y-3';

export function CVEditor({ open, onOpenChange, cv, setCV, update, tab, onTabChange: setTab }: CVEditorProps) {
  const { m } = useI18n();
  const e = m.editor;
  const importRef = useRef<HTMLInputElement>(null);
  const photoRef = useRef<HTMLInputElement>(null);
  // Raw text keeps trailing commas/new lines while typing; the parsed list is saved on every keystroke.
  const [skillsText, setSkillsText] = useState(() => cv.skills.join('\n'));
  useEffect(() => {
    // Re-sync when skills change from outside the field (import, reset, start blank).
    if (parseSkills(skillsText).join('|') !== cv.skills.join('|')) setSkillsText(cv.skills.join('\n'));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [cv.skills]);

  const setProfile = (key: keyof Profile, value: string) =>
    update((d) => ({ ...d, profile: { ...d.profile, [key]: value } }));

  function setItem<K extends ListKey>(key: K, id: string, patch: Partial<CVData[K][number]>) {
    update((d) => ({ ...d, [key]: (d[key] as CVData[K][number][]).map((it) => (it.id === id ? { ...it, ...patch } : it)) }));
  }
  const addItem = (key: ListKey) => update((d) => ({ ...d, [key]: [...d[key], emptyItems[key]()] }));
  const removeItem = (key: ListKey, id: string) =>
    update((d) => ({ ...d, [key]: (d[key] as { id: string }[]).filter((it) => it.id !== id) }));
  const moveItem = (key: ListKey, index: number, dir: -1 | 1) =>
    update((d) => {
      const list = [...(d[key] as { id: string }[])];
      const [item] = list.splice(index, 1);
      list.splice(index + dir, 0, item);
      return { ...d, [key]: list };
    });
  const controls = (key: ListKey, index: number, length: number, id: string, label: string) => (
    <ItemControls
      label={label || e.item}
      onUp={index > 0 ? () => moveItem(key, index, -1) : undefined}
      onDown={index < length - 1 ? () => moveItem(key, index, 1) : undefined}
      onRemove={() => removeItem(key, id)}
    />
  );

  /** Suggests an official logo when a tool/company name is entered and no logo is set yet. */
  const autoIcon = async (name: string, current: string | undefined, apply: (icon: string) => void) => {
    if (current || !name.trim()) return;
    const match = await findIcon(name);
    if (match) apply(match.dataUrl);
  };

  const onImport = async (file: File | undefined) => {
    if (!file) return;
    try {
      setCV(normalize(JSON.parse(await file.text())));
      toast.success(e.imported);
    } catch {
      toast.error(e.importError);
    }
  };

  const confirmReplace = (next: CVData, message: string) => {
    if (window.confirm(message)) {
      setCV(structuredClone(next));
      setTab('profile');
    }
  };

  const wordCount = cv.summary.trim().split(/\s+/).filter(Boolean).length;

  return (
    <Sheet open={open} onOpenChange={onOpenChange} modal={false}>
      <SheetContent
        side="right"
        onInteractOutside={(ev) => ev.preventDefault()}
        className="w-full sm:max-w-[480px] gap-0 p-0 print:hidden bg-white dark:bg-zinc-950 border-zinc-200 dark:border-zinc-800 shadow-2xl"
      >
        <SheetHeader className="border-b border-zinc-200 dark:border-zinc-800 px-5 py-4">
          <SheetTitle>{e.title}</SheetTitle>
          <SheetDescription className="text-xs text-zinc-600 dark:text-zinc-400">{e.description}</SheetDescription>
        </SheetHeader>

        <Tabs value={tab} onValueChange={(v) => setTab(v as Tab)} className="flex-1 min-h-0 gap-0">
          <div className="px-5 pt-3">
            <TabsList className="w-full h-auto flex-wrap">
              <TabsTrigger value="profile" className="text-xs">{e.tabs.profile}</TabsTrigger>
              <TabsTrigger value="skills" className="text-xs">{e.tabs.skills}</TabsTrigger>
              <TabsTrigger value="experience" className="text-xs">{e.tabs.experience}</TabsTrigger>
              <TabsTrigger value="more" className="text-xs">{e.tabs.more}</TabsTrigger>
              <TabsTrigger value="ats" className="text-xs">{e.tabs.ats}</TabsTrigger>
            </TabsList>
          </div>

          <div className="flex-1 overflow-y-auto px-5 py-5">
            <TabsContent value="profile" className="space-y-4 mt-0">
              <div className="border-b border-rule pb-4">
                <PrivacySwitch isPublic={Boolean(cv.isPublic)} onChange={(isPublic) => update((d) => ({ ...d, isPublic }))} withHint />
              </div>
              <div className="flex items-start gap-4">
                <Portrait photo={cv.profile.photo} name={cv.profile.name} className="h-20 w-20 shrink-0 text-2xl" alt={fmt(m.photo.alt, { name: cv.profile.name })} />
                <div className="space-y-2">
                  <p className="text-xs font-medium text-zinc-700 dark:text-zinc-300">{m.photo.label}</p>
                  <div className="flex flex-wrap gap-2">
                    <Button type="button" variant="outline" size="sm" className="h-8 gap-1.5 text-xs" onClick={() => photoRef.current?.click()}>
                      <Camera size={14} aria-hidden="true" /> {cv.profile.photo ? m.photo.change : m.photo.add}
                    </Button>
                    {cv.profile.photo && (
                      <Button type="button" variant="ghost" size="sm" className="h-8 text-xs" onClick={() => setProfile('photo', '')}>
                        {m.photo.remove}
                      </Button>
                    )}
                  </div>
                  <p className="text-[11px] leading-snug text-zinc-600 dark:text-zinc-400">{m.photo.hint}</p>
                  <input
                    ref={photoRef}
                    type="file"
                    accept="image/*"
                    className="hidden"
                    tabIndex={-1}
                    aria-hidden="true"
                    onChange={async (ev) => {
                      const file = ev.target.files?.[0];
                      ev.target.value = '';
                      if (!file) return;
                      try {
                        setProfile('photo', await processPhoto(file));
                      } catch {
                        toast.error(m.photo.error);
                      }
                    }}
                  />
                </div>
              </div>
              <Field label={e.fullName}>
                <Input autoComplete="name" value={cv.profile.name} onChange={(ev) => setProfile('name', ev.target.value)} />
              </Field>
              <Field label={e.headline} hint={e.headlineHint}>
                <Input autoComplete="organization-title" value={cv.profile.headline} onChange={(ev) => setProfile('headline', ev.target.value)} />
              </Field>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <Field label={e.email}>
                  <Input type="email" autoComplete="email" value={cv.profile.email} onChange={(ev) => setProfile('email', ev.target.value)} />
                </Field>
                <Field label={e.phone}>
                  <Input type="tel" autoComplete="tel" value={cv.profile.phone} placeholder="+33 6 12 34 56 78" onChange={(ev) => setProfile('phone', ev.target.value)} />
                </Field>
              </div>
              <Field label={e.location} hint={e.locationHint}>
                <Input autoComplete="address-level2" value={cv.profile.location} onChange={(ev) => setProfile('location', ev.target.value)} />
              </Field>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <Field label={e.linkedin}>
                  <Input type="url" value={cv.profile.linkedin} placeholder="linkedin.com/in/…" onChange={(ev) => setProfile('linkedin', ev.target.value)} />
                </Field>
                <Field label={e.website}>
                  <Input type="url" autoComplete="url" value={cv.profile.website} placeholder="example.com" onChange={(ev) => setProfile('website', ev.target.value)} />
                </Field>
              </div>
              <Field label={e.summary} hint={fmt(e.summaryHint, { count: wordCount })}>
                <Textarea className="min-h-32" value={cv.summary} onChange={(ev) => update((d) => ({ ...d, summary: ev.target.value }))} />
              </Field>
            </TabsContent>

            <TabsContent value="skills" className="space-y-6 mt-0">
              <Field label={e.coreSkills} hint={e.coreSkillsHint}>
                <Textarea
                  className="min-h-28"
                  value={skillsText}
                  onChange={(ev) => {
                    setSkillsText(ev.target.value);
                    update((d) => ({ ...d, skills: parseSkills(ev.target.value) }));
                  }}
                />
              </Field>

              <div className="space-y-3">
                <SectionHeading title={e.toolsTitle} onAdd={() => addItem('tools')} addLabel={e.addTool} />
                <p className="text-[11px] text-zinc-600 dark:text-zinc-400">{e.toolsHint}</p>
                <ul className="space-y-2">
                  {cv.tools.map((t, i) => (
                    <li key={t.id} className="flex items-center gap-2">
                      <IconPicker value={t.icon} name={t.name} onChange={(icon) => setItem('tools', t.id, { icon })} />
                      <div className="grid flex-1 grid-cols-2 gap-2 min-w-0">
                        <Input
                          aria-label={e.toolName}
                          placeholder={e.toolName}
                          value={t.name}
                          onChange={(ev) => setItem('tools', t.id, { name: ev.target.value })}
                          onBlur={(ev) => autoIcon(ev.target.value, t.icon, (icon) => setItem('tools', t.id, { icon }))}
                        />
                        <Input
                          aria-label={`${e.toolDescription} (${t.name || e.item})`}
                          placeholder={e.toolDescription}
                          value={t.description}
                          onChange={(ev) => setItem('tools', t.id, { description: ev.target.value })}
                        />
                      </div>
                      {controls('tools', i, cv.tools.length, t.id, t.name)}
                    </li>
                  ))}
                </ul>
              </div>
            </TabsContent>

            <TabsContent value="experience" className="space-y-4 mt-0">
              <SectionHeading title={e.experienceTitle} onAdd={() => addItem('experience')} addLabel={e.addRole} />
              {cv.experience.map((x, i) => (
                <fieldset key={x.id} className={cardClass}>
                  <legend className="sr-only">{x.title || e.newRole}</legend>
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-center gap-2 min-w-0">
                      <IconPicker fill value={x.logo} name={x.company} onChange={(logo) => setItem('experience', x.id, { logo })} />
                      <span className="truncate text-sm font-medium" aria-hidden="true">{x.title || e.newRole}</span>
                    </div>
                    {controls('experience', i, cv.experience.length, x.id, x.title)}
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <Field label={e.jobTitle}>
                      <Input value={x.title} onChange={(ev) => setItem('experience', x.id, { title: ev.target.value })} />
                    </Field>
                    <Field label={e.company}>
                      <Input
                        value={x.company}
                        onChange={(ev) => setItem('experience', x.id, { company: ev.target.value })}
                        onBlur={(ev) => autoIcon(ev.target.value, x.logo, (logo) => setItem('experience', x.id, { logo }))}
                      />
                    </Field>
                    <Field label={e.location}>
                      <Input value={x.location} placeholder={e.roleLocationPlaceholder} onChange={(ev) => setItem('experience', x.id, { location: ev.target.value })} />
                    </Field>
                    <Field label={e.type}>
                      <Input value={x.employmentType} placeholder={e.typePlaceholder} onChange={(ev) => setItem('experience', x.id, { employmentType: ev.target.value })} />
                    </Field>
                    <Field label={e.start}>
                      <Input value={x.start} placeholder={e.startPlaceholder} onChange={(ev) => setItem('experience', x.id, { start: ev.target.value })} />
                    </Field>
                    <Field label={e.end}>
                      <Input value={x.end} placeholder={e.endPlaceholder} onChange={(ev) => setItem('experience', x.id, { end: ev.target.value })} />
                    </Field>
                  </div>
                  <Field label={e.achievements} hint={e.achievementsHint}>
                    <Textarea
                      className="min-h-28"
                      value={x.bullets.join('\n')}
                      onChange={(ev) => setItem('experience', x.id, { bullets: ev.target.value.split('\n') })}
                    />
                  </Field>
                </fieldset>
              ))}
            </TabsContent>

            <TabsContent value="more" className="space-y-8 mt-0">
              <div className="space-y-3">
                <SectionHeading title={e.educationTitle} onAdd={() => addItem('education')} addLabel={e.add} />
                {cv.education.length === 0 && <p className="text-xs text-zinc-600 dark:text-zinc-400">{e.noEducation}</p>}
                {cv.education.map((x, i) => (
                  <fieldset key={x.id} className={cardClass}>
                    <legend className="sr-only">{x.degree || e.newEducation}</legend>
                    <div className="flex justify-between items-center">
                      <span className="truncate text-sm font-medium" aria-hidden="true">{x.degree || e.newEducation}</span>
                      {controls('education', i, cv.education.length, x.id, x.degree)}
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <Field label={e.degree}>
                        <Input value={x.degree} onChange={(ev) => setItem('education', x.id, { degree: ev.target.value })} />
                      </Field>
                      <Field label={e.school}>
                        <Input value={x.school} onChange={(ev) => setItem('education', x.id, { school: ev.target.value })} />
                      </Field>
                      <Field label={e.start}>
                        <Input value={x.start} placeholder="2009" onChange={(ev) => setItem('education', x.id, { start: ev.target.value })} />
                      </Field>
                      <Field label={e.end}>
                        <Input value={x.end} placeholder="2012" onChange={(ev) => setItem('education', x.id, { end: ev.target.value })} />
                      </Field>
                    </div>
                    <Field label={e.location}>
                      <Input value={x.location} onChange={(ev) => setItem('education', x.id, { location: ev.target.value })} />
                    </Field>
                    <Field label={e.details}>
                      <Input value={x.details} onChange={(ev) => setItem('education', x.id, { details: ev.target.value })} />
                    </Field>
                  </fieldset>
                ))}
              </div>

              <div className="space-y-3">
                <SectionHeading title={e.certificationsTitle} onAdd={() => addItem('certifications')} addLabel={e.add} />
                {cv.certifications.map((c, i) => (
                  <fieldset key={c.id} className="rounded-lg border border-zinc-200 dark:border-zinc-800 p-3 space-y-2">
                    <legend className="sr-only">{c.title || e.certification}</legend>
                    <div className="flex gap-2 items-center">
                      <Input aria-label={e.certification} placeholder={e.certification} value={c.title} onChange={(ev) => setItem('certifications', c.id, { title: ev.target.value })} />
                      {controls('certifications', i, cv.certifications.length, c.id, c.title)}
                    </div>
                    <div className="grid grid-cols-3 gap-2">
                      <Input aria-label={e.topic} placeholder={e.topic} className="col-span-3" value={c.description} onChange={(ev) => setItem('certifications', c.id, { description: ev.target.value })} />
                      <Input aria-label={e.issuer} placeholder={e.issuer} className="col-span-2" value={c.issuer} onChange={(ev) => setItem('certifications', c.id, { issuer: ev.target.value })} />
                      <Input aria-label={e.year} placeholder={e.year} inputMode="numeric" value={c.year} onChange={(ev) => setItem('certifications', c.id, { year: ev.target.value })} />
                    </div>
                  </fieldset>
                ))}
              </div>

              <div className="space-y-3">
                <SectionHeading title={e.languagesTitle} onAdd={() => addItem('languages')} addLabel={e.add} />
                <ul className="space-y-2">
                  {cv.languages.map((l, i) => (
                    <li key={l.id} className="flex gap-2 items-center">
                      <Input aria-label={e.languageName} placeholder={e.languageName} value={l.name} onChange={(ev) => setItem('languages', l.id, { name: ev.target.value })} />
                      <Input aria-label={`${e.level} (${l.name || e.languageName})`} placeholder={e.levelPlaceholder} value={l.level} onChange={(ev) => setItem('languages', l.id, { level: ev.target.value })} />
                      {controls('languages', i, cv.languages.length, l.id, l.name)}
                    </li>
                  ))}
                </ul>
              </div>
            </TabsContent>

            <TabsContent value="ats" className="mt-0">
              <AtsPanel
                cv={cv}
                onJump={(section) => setTab(sectionTab[section])}
                onAddSkill={(skill) =>
                  update((d) => (d.skills.some((s) => s.toLowerCase() === skill.toLowerCase()) ? d : { ...d, skills: [...d.skills, skill] }))
                }
              />
            </TabsContent>
          </div>
        </Tabs>

        <div className="border-t border-zinc-200 dark:border-zinc-800 px-5 py-3 grid grid-cols-3 gap-2">
          <Button variant="outline" size="sm" className="gap-1.5 text-xs" onClick={() => importRef.current?.click()}>
            <FileUp size={14} aria-hidden="true" /> {e.import}
          </Button>
          <Button
            variant="outline"
            size="sm"
            className="gap-1.5 text-xs"
            onClick={() => downloadFile(`${fileSlug(cv.profile.name)}_CV.json`, JSON.stringify(cv, null, 2), 'application/json')}
          >
            <FileDown size={14} aria-hidden="true" /> {e.export}
          </Button>
          <Button
            variant="outline"
            size="sm"
            className="gap-1.5 text-xs"
            onClick={async () => {
              const text = toPlainText(cv, m);
              try {
                await navigator.clipboard.writeText(text);
                toast.success(e.copied);
              } catch {
                downloadFile(`${fileSlug(cv.profile.name)}_CV.txt`, text, 'text/plain');
              }
            }}
          >
            <Copy size={14} aria-hidden="true" /> {e.copyText}
          </Button>
          <Button
            variant="ghost"
            size="sm"
            className="gap-1.5 text-xs col-span-3 sm:col-span-1"
            onClick={() => confirmReplace(blankCV, e.confirmBlank)}
          >
            <FilePlus2 size={14} aria-hidden="true" /> {e.startBlank}
          </Button>
          <Button
            variant="ghost"
            size="sm"
            className="gap-1.5 text-xs col-span-3 sm:col-span-2"
            onClick={() => confirmReplace(sampleCV, e.confirmReset)}
          >
            <RotateCcw size={14} aria-hidden="true" /> {e.resetSample}
          </Button>
          <input
            ref={importRef}
            type="file"
            accept="application/json,.json"
            className="hidden"
            tabIndex={-1}
            aria-hidden="true"
            onChange={(ev) => {
              onImport(ev.target.files?.[0]);
              ev.target.value = '';
            }}
          />
        </div>
      </SheetContent>
    </Sheet>
  );
}
