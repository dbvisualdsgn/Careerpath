import { useRef, useState } from 'react';
import { ArrowDown, ArrowUp, Copy, FileDown, FileUp, Plus, RotateCcw, Trash2, FilePlus2 } from 'lucide-react';
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
import type { CVData, ListKey, Profile } from '../../cv/types';
import type { Finding } from '../../cv/atsCheck';

interface CVEditorProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  cv: CVData;
  setCV: (cv: CVData) => void;
  update: (fn: (cv: CVData) => CVData) => void;
}

type Tab = 'profile' | 'skills' | 'experience' | 'more' | 'ats';
const sectionTab: Record<Finding['section'], Tab> = {
  profile: 'profile', summary: 'profile', skills: 'skills', experience: 'experience', education: 'more', extras: 'more',
};

function Field({ label, hint, children }: { label: string; hint?: string; children: React.ReactNode }) {
  return (
    <div className="space-y-1.5">
      <Label className="text-xs text-zinc-600 dark:text-zinc-400">{label}</Label>
      {children}
      {hint && <p className="text-[11px] text-zinc-400">{hint}</p>}
    </div>
  );
}

function ItemControls({ onUp, onDown, onRemove, label }: { onUp?: () => void; onDown?: () => void; onRemove: () => void; label: string }) {
  return (
    <div className="flex shrink-0 items-center">
      <Button type="button" variant="ghost" size="icon" className="h-8 w-8" disabled={!onUp} onClick={onUp} title="Move up">
        <ArrowUp size={14} /><span className="sr-only">Move {label} up</span>
      </Button>
      <Button type="button" variant="ghost" size="icon" className="h-8 w-8" disabled={!onDown} onClick={onDown} title="Move down">
        <ArrowDown size={14} /><span className="sr-only">Move {label} down</span>
      </Button>
      <Button type="button" variant="ghost" size="icon" className="h-8 w-8 text-zinc-400 hover:text-red-600" onClick={onRemove} title="Remove">
        <Trash2 size={14} /><span className="sr-only">Remove {label}</span>
      </Button>
    </div>
  );
}

function SectionHeading({ title, onAdd, addLabel }: { title: string; onAdd?: () => void; addLabel?: string }) {
  return (
    <div className="flex items-center justify-between">
      <h4 className="text-xs font-semibold uppercase tracking-wider text-zinc-500">{title}</h4>
      {onAdd && (
        <Button type="button" variant="outline" size="sm" className="h-8 gap-1" onClick={onAdd}>
          <Plus size={14} /> {addLabel}
        </Button>
      )}
    </div>
  );
}

export function CVEditor({ open, onOpenChange, cv, setCV, update }: CVEditorProps) {
  const [tab, setTab] = useState<Tab>('profile');
  const importRef = useRef<HTMLInputElement>(null);

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
      label={label}
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
      toast.success('CV imported');
    } catch {
      toast.error('That file is not a valid CV JSON export.');
    }
  };

  const confirmReplace = (next: CVData, message: string) => {
    if (window.confirm(message)) {
      setCV(structuredClone(next));
      setTab('profile');
    }
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange} modal={false}>
      <SheetContent
        side="right"
        onInteractOutside={(e) => e.preventDefault()}
        className="w-full sm:max-w-[480px] gap-0 p-0 print:hidden bg-white dark:bg-zinc-950 border-zinc-200 dark:border-zinc-800 shadow-2xl"
      >
        <SheetHeader className="border-b border-zinc-200 dark:border-zinc-800 px-5 py-4">
          <SheetTitle>Edit CV</SheetTitle>
          <SheetDescription className="text-xs">Changes save automatically in this browser and show live in the preview.</SheetDescription>
        </SheetHeader>

        <Tabs value={tab} onValueChange={(v) => setTab(v as Tab)} className="flex-1 min-h-0 gap-0">
          <div className="px-5 pt-3">
            <TabsList className="w-full">
              <TabsTrigger value="profile" className="text-xs">Profile</TabsTrigger>
              <TabsTrigger value="skills" className="text-xs">Skills</TabsTrigger>
              <TabsTrigger value="experience" className="text-xs">Experience</TabsTrigger>
              <TabsTrigger value="more" className="text-xs">More</TabsTrigger>
              <TabsTrigger value="ats" className="text-xs">ATS check</TabsTrigger>
            </TabsList>
          </div>

          <div className="flex-1 overflow-y-auto px-5 py-5">
            <TabsContent value="profile" className="space-y-4 mt-0">
              <Field label="Full name">
                <Input value={cv.profile.name} onChange={(e) => setProfile('name', e.target.value)} />
              </Field>
              <Field label="Headline / target job title" hint="Use the exact title from the job ads you apply to.">
                <Input value={cv.profile.headline} onChange={(e) => setProfile('headline', e.target.value)} />
              </Field>
              <div className="grid grid-cols-2 gap-3">
                <Field label="Email">
                  <Input type="email" value={cv.profile.email} onChange={(e) => setProfile('email', e.target.value)} />
                </Field>
                <Field label="Phone">
                  <Input type="tel" value={cv.profile.phone} placeholder="+33 6 12 34 56 78" onChange={(e) => setProfile('phone', e.target.value)} />
                </Field>
              </div>
              <Field label="Location" hint="City, Country">
                <Input value={cv.profile.location} placeholder="Paris, France" onChange={(e) => setProfile('location', e.target.value)} />
              </Field>
              <div className="grid grid-cols-2 gap-3">
                <Field label="LinkedIn">
                  <Input value={cv.profile.linkedin} placeholder="linkedin.com/in/you" onChange={(e) => setProfile('linkedin', e.target.value)} />
                </Field>
                <Field label="Website / portfolio">
                  <Input value={cv.profile.website} placeholder="yoursite.com" onChange={(e) => setProfile('website', e.target.value)} />
                </Field>
              </div>
              <Field label="Professional summary" hint={`${cv.summary.trim().split(/\s+/).filter(Boolean).length} words. Aim for 40–100, with no "I" or "my".`}>
                <Textarea className="min-h-32" value={cv.summary} onChange={(e) => update((d) => ({ ...d, summary: e.target.value }))} />
              </Field>
            </TabsContent>

            <TabsContent value="skills" className="space-y-6 mt-0">
              <Field label="Core skills" hint="One per line or comma-separated. Use the job ads' wording, e.g. “Design Systems”.">
                <Textarea
                  className="min-h-28"
                  defaultValue={cv.skills.join('\n')}
                  key={cv.skills.join('|')}
                  onBlur={(e) =>
                    update((d) => ({ ...d, skills: e.target.value.split(/[\n,]/).map((s) => s.trim()).filter(Boolean) }))
                  }
                />
              </Field>

              <div className="space-y-3">
                <SectionHeading title="Stack & tools" onAdd={() => addItem('tools')} addLabel="Add tool" />
                {cv.tools.map((t, i) => (
                  <div key={t.id} className="flex items-center gap-2">
                    <IconPicker value={t.icon} name={t.name} onChange={(icon) => setItem('tools', t.id, { icon })} />
                    <div className="grid flex-1 grid-cols-2 gap-2 min-w-0">
                      <Input
                        aria-label="Tool name"
                        placeholder="Tool name"
                        value={t.name}
                        onChange={(e) => setItem('tools', t.id, { name: e.target.value })}
                        onBlur={(e) => autoIcon(e.target.value, t.icon, (icon) => setItem('tools', t.id, { icon }))}
                      />
                      <Input
                        aria-label="Tool description"
                        placeholder="What you use it for"
                        value={t.description}
                        onChange={(e) => setItem('tools', t.id, { description: e.target.value })}
                      />
                    </div>
                    {controls('tools', i, cv.tools.length, t.id, t.name || 'tool')}
                  </div>
                ))}
                <p className="text-[11px] text-zinc-400">Type a tool name and the official logo is added automatically. Click the logo to search or upload another.</p>
              </div>
            </TabsContent>

            <TabsContent value="experience" className="space-y-4 mt-0">
              <SectionHeading title="Work experience" onAdd={() => addItem('experience')} addLabel="Add role" />
              {cv.experience.map((e, i) => (
                <div key={e.id} className="rounded-lg border border-zinc-200 dark:border-zinc-800 p-4 space-y-3">
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-center gap-2 min-w-0">
                      <IconPicker value={e.logo} name={e.company} onChange={(logo) => setItem('experience', e.id, { logo })} />
                      <span className="truncate text-sm font-medium">{e.title || 'New role'}</span>
                    </div>
                    {controls('experience', i, cv.experience.length, e.id, e.title || 'role')}
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <Field label="Job title">
                      <Input value={e.title} onChange={(ev) => setItem('experience', e.id, { title: ev.target.value })} />
                    </Field>
                    <Field label="Company">
                      <Input
                        value={e.company}
                        onChange={(ev) => setItem('experience', e.id, { company: ev.target.value })}
                        onBlur={(ev) => autoIcon(ev.target.value, e.logo, (logo) => setItem('experience', e.id, { logo }))}
                      />
                    </Field>
                    <Field label="Location">
                      <Input value={e.location} placeholder="City, Country (Remote)" onChange={(ev) => setItem('experience', e.id, { location: ev.target.value })} />
                    </Field>
                    <Field label="Type">
                      <Input value={e.employmentType} placeholder="Full-time, Freelance…" onChange={(ev) => setItem('experience', e.id, { employmentType: ev.target.value })} />
                    </Field>
                    <Field label="Start">
                      <Input value={e.start} placeholder="Mar 2023" onChange={(ev) => setItem('experience', e.id, { start: ev.target.value })} />
                    </Field>
                    <Field label="End">
                      <Input value={e.end} placeholder="Present" onChange={(ev) => setItem('experience', e.id, { end: ev.target.value })} />
                    </Field>
                  </div>
                  <Field label="Achievements (one per line)" hint="Start with an action verb and add a number: “Redesigned onboarding, lifting activation 18%.”">
                    <Textarea
                      className="min-h-28"
                      value={e.bullets.join('\n')}
                      onChange={(ev) => setItem('experience', e.id, { bullets: ev.target.value.split('\n') })}
                    />
                  </Field>
                </div>
              ))}
            </TabsContent>

            <TabsContent value="more" className="space-y-8 mt-0">
              <div className="space-y-3">
                <SectionHeading title="Education" onAdd={() => addItem('education')} addLabel="Add" />
                {cv.education.length === 0 && <p className="text-xs text-zinc-400">No education yet. Most ATS expect this section.</p>}
                {cv.education.map((e, i) => (
                  <div key={e.id} className="rounded-lg border border-zinc-200 dark:border-zinc-800 p-4 space-y-3">
                    <div className="flex justify-between items-center">
                      <span className="truncate text-sm font-medium">{e.degree || 'New education'}</span>
                      {controls('education', i, cv.education.length, e.id, e.degree || 'education')}
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      <Field label="Degree / program">
                        <Input value={e.degree} onChange={(ev) => setItem('education', e.id, { degree: ev.target.value })} />
                      </Field>
                      <Field label="School">
                        <Input value={e.school} onChange={(ev) => setItem('education', e.id, { school: ev.target.value })} />
                      </Field>
                      <Field label="Start">
                        <Input value={e.start} placeholder="2009" onChange={(ev) => setItem('education', e.id, { start: ev.target.value })} />
                      </Field>
                      <Field label="End">
                        <Input value={e.end} placeholder="2012" onChange={(ev) => setItem('education', e.id, { end: ev.target.value })} />
                      </Field>
                    </div>
                    <Field label="Location">
                      <Input value={e.location} onChange={(ev) => setItem('education', e.id, { location: ev.target.value })} />
                    </Field>
                    <Field label="Details (optional)">
                      <Input value={e.details} onChange={(ev) => setItem('education', e.id, { details: ev.target.value })} />
                    </Field>
                  </div>
                ))}
              </div>

              <div className="space-y-3">
                <SectionHeading title="Certifications" onAdd={() => addItem('certifications')} addLabel="Add" />
                {cv.certifications.map((c, i) => (
                  <div key={c.id} className="rounded-lg border border-zinc-200 dark:border-zinc-800 p-3 space-y-2">
                    <div className="flex gap-2 items-center">
                      <Input aria-label="Certification" placeholder="Certification" value={c.title} onChange={(ev) => setItem('certifications', c.id, { title: ev.target.value })} />
                      {controls('certifications', i, cv.certifications.length, c.id, c.title || 'certification')}
                    </div>
                    <div className="grid grid-cols-3 gap-2">
                      <Input aria-label="Topic" placeholder="Topic" className="col-span-3" value={c.description} onChange={(ev) => setItem('certifications', c.id, { description: ev.target.value })} />
                      <Input aria-label="Issuer" placeholder="Issuer" className="col-span-2" value={c.issuer} onChange={(ev) => setItem('certifications', c.id, { issuer: ev.target.value })} />
                      <Input aria-label="Year" placeholder="Year" value={c.year} onChange={(ev) => setItem('certifications', c.id, { year: ev.target.value })} />
                    </div>
                  </div>
                ))}
              </div>

              <div className="space-y-3">
                <SectionHeading title="Languages" onAdd={() => addItem('languages')} addLabel="Add" />
                {cv.languages.map((l, i) => (
                  <div key={l.id} className="flex gap-2 items-center">
                    <Input aria-label="Language" placeholder="Language" value={l.name} onChange={(ev) => setItem('languages', l.id, { name: ev.target.value })} />
                    <Input aria-label="Level" placeholder="Native, C1, Fluent…" value={l.level} onChange={(ev) => setItem('languages', l.id, { level: ev.target.value })} />
                    {controls('languages', i, cv.languages.length, l.id, l.name || 'language')}
                  </div>
                ))}
              </div>
            </TabsContent>

            <TabsContent value="ats" className="mt-0">
              <AtsPanel cv={cv} onJump={(section) => setTab(sectionTab[section])} />
            </TabsContent>
          </div>
        </Tabs>

        <div className="border-t border-zinc-200 dark:border-zinc-800 px-5 py-3 grid grid-cols-3 gap-2">
          <Button variant="outline" size="sm" className="gap-1.5 text-xs" onClick={() => importRef.current?.click()}>
            <FileUp size={14} /> Import
          </Button>
          <Button
            variant="outline"
            size="sm"
            className="gap-1.5 text-xs"
            onClick={() => downloadFile(`${fileSlug(cv.profile.name)}_CV.json`, JSON.stringify(cv, null, 2), 'application/json')}
          >
            <FileDown size={14} /> Export
          </Button>
          <Button
            variant="outline"
            size="sm"
            className="gap-1.5 text-xs"
            onClick={async () => {
              try {
                await navigator.clipboard.writeText(toPlainText(cv));
                toast.success('Plain-text CV copied: paste it into application forms');
              } catch {
                downloadFile(`${fileSlug(cv.profile.name)}_CV.txt`, toPlainText(cv), 'text/plain');
              }
            }}
          >
            <Copy size={14} /> Copy as text
          </Button>
          <Button
            variant="ghost"
            size="sm"
            className="gap-1.5 text-xs col-span-3 sm:col-span-1"
            onClick={() => confirmReplace(blankCV, 'Start a blank CV? Your current CV will be replaced. Export it first to keep a copy.')}
          >
            <FilePlus2 size={14} /> Start blank
          </Button>
          <Button
            variant="ghost"
            size="sm"
            className="gap-1.5 text-xs col-span-3 sm:col-span-2"
            onClick={() => confirmReplace(sampleCV, 'Reset to the sample CV? Your current CV will be replaced.')}
          >
            <RotateCcw size={14} /> Reset to sample
          </Button>
          <input
            ref={importRef}
            type="file"
            accept="application/json,.json"
            className="hidden"
            onChange={(e) => {
              onImport(e.target.files?.[0]);
              e.target.value = '';
            }}
          />
        </div>
      </SheetContent>
    </Sheet>
  );
}
