# curriculi curricula

A quick, calm way to write your CV. An editable, accessible online CV with official tool logos, an ATS-friendly PDF export and a built-in ATS checker,
available in English (default), Italian, French, Spanish, German, Portuguese and Dutch.
The original design is available at https://www.figma.com/design/68PhbcZDT2IDB8ndJuw2h6/Recreate-CV.

## Pages

- `/` is the homepage (`index.html` → `src/home/`).
- `/app/` is the CV tool (`app/index.html` → `src/app/`). `app/?new=1` starts writing, and `app/?example=1` opens the sample read-only.

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

## Share links

**Share** creates a personal link that contains the whole CV, compressed into the URL fragment (`#cv=…`).
Nothing is stored on a server and fragments are never sent to one, so any static host works.
Anyone who opens the link sees that CV read-only and can **Edit a copy** or **Create your own CV**, then share their
own link. Links are snapshots: after editing, create a new link. Built-in logos travel as short tokens. Very large
uploaded logos are left out to keep links short.

For other people to open links, the app must be hosted publicly (for example GitHub Pages, Vercel or Netlify).
Set `VITE_PUBLIC_URL` at build time if share links should point to a different address than the current page.

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

## ATS / AI screening best practices built in

- **Download PDF** builds a single-column, text-only PDF in the browser (jsPDF, Helvetica). It has standard section
  headings, contact details in the body, real selectable text, no icons, tables or columns, and title/author/keyword
  metadata. Printing the page (Ctrl+P) uses the same single-column layout.
- The page title becomes the PDF file name: `Name - Headline - CV`.
- Experience uses separate start/end dates and achievement bullets. Skills and tools are plain-text keywords.
- schema.org `Person` JSON-LD is embedded so AI tools can read the CV.
- **ATS check** (in the editor) scores the CV and lists fixes: missing contact details, undated roles,
  unquantified bullets, weak openers, tense, clichés, length, and more. Paste a job description to see which
  keywords are missing.
- **Copy as text** gives a clean plain-text CV for application forms.
