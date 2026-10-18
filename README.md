# curriculi curricula

A quick, calm way to write your CV. An editable, accessible online CV with official tool logos, an ATS-friendly PDF export and a built-in recruiter check,
available in English (default), Italian, French, Spanish, German, Portuguese and Dutch.
The original design is available at https://www.figma.com/design/68PhbcZDT2IDB8ndJuw2h6/Recreate-CV.

## Pages

- `/` is the homepage (`index.html` → `src/home/`).
- `/app/` is the CV tool (`app/index.html` → `src/app/`). `app/?new=1` starts writing, `app/?example=1` opens the sample read-only,
  and `app/?person=<id>` opens a public CV from the directory.
- `/people/` lists public CVs (`people/index.html` → `src/people/`). The 17 profiles in `src/app/cv/people.ts` are fictional examples.

**My CVs:** keep several CVs in the same browser (`src/app/cv/library.ts`). Switch, create and delete them from the
"My CVs" menu and the editor. An older single CV is migrated automatically.

**Import from PDF:** PDFs downloaded here carry the full CV in their XMP metadata (invisible to readers and ATS), so
importing one restores it exactly, photo and logos included. Any other PDF with selectable text is read with pdf.js and
split into sections using multilingual headings, month names and date ranges (`src/app/cv/importPdf.ts`). Check the
result in the editor; scanned PDFs without text can't be read.

**Private / Public:** a CV is private by default (it stays in the browser and sharing is off). Switching to public turns on
share links. A link carries its own copy of the CV, so links already sent cannot be revoked.

**Downloads:** "As on the page" builds a PDF with the same layout, embedded fonts (`public/fonts`: Switzer and Gambetta by the Indian Type Foundry via Fontshare, IBM Plex Mono under the SIL OFL), logos and
photo. "ATS plain" builds the one-column, text-only version for job portals.

The brand and tokens are documented in [DESIGN.md](DESIGN.md).

## Running the code

Run `npm i` to install the dependencies, then `npm run dev` to start the development server.

## Make it your own

1. Click **Edit CV**. Every section is editable, and changes save automatically in your browser.
2. Use **Start blank** for an empty CV, or **Reset to sample** to see the example again.
3. **Export** saves your CV as JSON, and **Import** loads it back on any device.
4. To make your version the default for everyone who visits, replace `sampleCV` in `src/app/cv/defaultCV.ts`
   with your data (an exported JSON has the same shape).

### Tool and company logos

Type a tool or company name and its official logo is added automatically. Click a logo to search more than
4,400 brands or upload your own. Logos come from the Iconify "logos" set and Simple Icons (both CC0).
`npm run icons` regenerates `src/app/cv/brandIcons.ts` and `src/app/cv/icon-catalog/` after updating either package.

## Private and public

Every CV starts **private**: it lives only in your browser's storage, has no link, and nobody else can open it.
You can still download it as a PDF.

Switching it to **public** (after a short confirmation) stores a copy on a small Supabase database so it can be
reached from anywhere:

- **One link** (`…/app/?id=ab12cd34ef`) that always shows the latest version: edits are re-published about two
  seconds after you stop typing.
- **Embed code**: an `<iframe>` with a compact, read-only view (`&embed=1`) for a personal site or portfolio.
- **Public CVs page** (opt-in): tick "Show it on the Public CVs page" to be listed on `/people/`. Listed CVs can be
  reported (spam, someone else's data, offensive); reports land in the `cv_reports` table.
- Switching back to **private** deletes the public copy, so the link, embeds and listing stop working at once.
  Deleting a public CV takes it down first.

There are no accounts. Making a CV public creates a random id and a secret owner token in your browser; only the
token's SHA-256 is stored, and only that browser can update or withdraw the copy. Everything that comes from the
server is sanitised before it is shown (images must be our own data URLs or built-in logo tokens).

Links made by earlier versions carried the whole CV in the URL fragment (`#cv=…`). They still open, but they are no
longer created, and they cannot be withdrawn.

### Setting up the public CV server

1. Create a free project at [supabase.com](https://supabase.com).
2. In **SQL Editor**, run [`supabase/schema.sql`](supabase/schema.sql). It creates the tables, row-level security
   (anyone can read public CVs; writes only through the token-checked functions) and the functions.
3. In **Project Settings → API**, copy the Project URL and the `anon` public key into `.env` (see `.env.example`).
   Both are meant to be public. Without them the site still works, but CVs can't be made public.

Set `VITE_PUBLIC_URL` at build time if public links should point to a different address than the current site.

### Renaming the GitHub repository

The repository is still called `Careerpath`, so the site lives at `dbvisualdsgn.github.io/Careerpath/`. It can be
renamed in the repository's **Settings → General**. Renaming changes the GitHub Pages URL, so share links people
already sent (which point at the old address) would stop opening. Only the storage keys `careerpath.cv.v1` and
`careerpath.jd.v1` keep the old name on purpose: saved CVs live under them.

## Languages

Pick a language from the header (English is the default). It translates the interface, the CV section headings
(on screen, in the PDF and in "Copy as text") and the ATS advice, and sets the page `lang` attribute.
Strings live in `src/app/i18n/`. Add a locale by copying `en.ts` and registering it in `src/app/i18n/index.tsx`.
Wording checks (action verbs, tense, clichés) run for English only.

## Accessibility

Built and tested against WCAG 2.2 AA with axe-core (0 violations in light, dark, editor and translated views):
skip link, landmarks and a logical heading order, labelled controls with linked hints, visible focus
outlines, AA colour contrast in both themes, decorative icons hidden from screen readers, a native language
selector, and animations that respect "reduce motion".

## Built for recruiters and hiring software

- **Download PDF** builds a single-column, text-only PDF in the browser (jsPDF, Helvetica). It has standard section
  headings, contact details in the body, real selectable text, no icons, tables or columns, and title/author/keyword
  metadata. Printing the page (Ctrl+P) uses the same single-column layout.
- The page title becomes the PDF file name: `Name - Headline - CV`.
- Experience uses separate start/end dates and achievement bullets. Skills and tools are plain-text keywords.
- schema.org `Person` JSON-LD is embedded so AI tools can read the CV.
- **Recruiter check** (in the editor) scores the CV and lists fixes, each with the points it costs: numbers in
  bullets, months on dates, a strong latest role, contact details, weak openers, tense, clichés, length, and more.
  The weights are documented at the top of `src/app/cv/atsCheck.ts`. Paste a job ad to see its job title (and
  whether your headline matches it) and which keywords are missing, matched as whole words in 7 languages.
- **Copy as text** gives a clean plain-text CV for application forms.

## Credits

Typefaces: **Switzer** and **Gambetta** by the [Indian Type Foundry](https://www.indiantypefoundry.com), from
[Fontshare](https://www.fontshare.com) (ITF Free Font License); **IBM Plex Mono** (SIL Open Font License).
Title fonts: 78 families from Fontshare, each under its own license (ITF Free Font License or SIL OFL), with
designers listed in `public/fonts/titles/CREDITS.txt`.
Logos: Iconify "logos" set and Simple Icons (CC0).
