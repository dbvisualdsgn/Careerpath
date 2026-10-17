# careerpath.CV

An editable, accessible online CV with official tool logos, an ATS-friendly PDF export and a built-in ATS checker,
available in English (default), Italian, French, Spanish, German, Portuguese and Dutch.
The original design is available at https://www.figma.com/design/68PhbcZDT2IDB8ndJuw2h6/Recreate-CV.

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

- **Download PDF** prints a separate single-column, text-only layout. It has standard section headings
  (Professional Summary, Skills, Work Experience, Education, Certifications, Languages), contact details in
  the body, plain Arial text, and no icons, tables or columns. In the print dialog, untick "Headers and footers".
- The page title becomes the PDF file name: `Name - Headline - CV`.
- Experience uses separate start/end dates and achievement bullets. Skills and tools are plain-text keywords.
- schema.org `Person` JSON-LD is embedded so AI tools can read the CV.
- **ATS check** (in the editor) scores the CV and lists fixes: missing contact details, undated roles,
  unquantified bullets, weak openers, tense, clichés, length, and more. Paste a job description to see which
  keywords are missing.
- **Copy as text** gives a clean plain-text CV for application forms.
