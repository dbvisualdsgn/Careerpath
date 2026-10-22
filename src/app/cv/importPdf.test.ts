// @ts-expect-error Node's types are not installed; the test runs in Node under Vitest.
import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import * as pdfjs from 'pdfjs-dist/legacy/build/pdf.mjs';
import { parseLines, readLines } from './importPdf';

// Fixtures: CVs printed to PDF by Chromium. Two-column layouts, letter-spaced headings
// ("P R O F I L E"), and this site's own PDFs.
async function read(name: string) {
  const data = new Uint8Array(readFileSync(new URL(`./__fixtures__/${name}.pdf`, import.meta.url)));
  const doc = await pdfjs.getDocument({ data }).promise;
  return parseLines(await readLines(doc));
}

describe('importing a PDF fills every section', () => {
  for (const name of ['two-col-left', 'two-col-right', 'one-col']) {
    it(name, async () => {
      const cv = await read(name);
      expect(cv.profile.name).toBe('Jane Doe');
      expect(cv.profile.headline).toBe('Senior Product Designer');
      expect(cv.profile.email).toBe('jane.doe@mail.com');
      expect(cv.profile.location).toBe('Rennes, France');
      expect(cv.profile.website).toBe('janedoe.com');
      expect(cv.summary).toMatch(/^Graphic and product designer since 2013/);
      expect(cv.experience.map((e) => [e.title, e.company, e.location, e.start, e.end])).toEqual([
        ['Senior Product Designer', 'Doctolib', 'Paris, France', 'Mar 2023', 'Present'],
        ['Product Designer', 'Qonto', 'Paris, France', 'Jan 2019', 'Feb 2023'],
      ]);
      expect(cv.experience[0].bullets).toHaveLength(2);
      expect(cv.skills).toEqual(['Design systems', 'User research', 'Prototyping', 'Accessibility']);
      expect(cv.tools.map((t) => t.name)).toEqual(['Figma', 'Miro', 'Notion']);
      expect(cv.languages.map((l) => `${l.name}:${l.level}`)).toEqual(['Italian:Native', 'English:C1', 'French:B2']);
      expect(cv.education.map((e) => [e.degree, e.school, e.start, e.end])).toEqual([['MA Visual Design', 'ISIA Urbino', '2010', '2013']]);
    });
  }

  // The site's own PDFs read as text only (as if their embedded data were lost), and the page printed by the browser.
  it.each(['browser-print', 'app-designed', 'app-plain'])('%s', async (name) => {
    const cv = await read(name);
    expect(cv.profile.name).toBe('Sofia Andersson');
    expect(cv.profile.headline).toBe('UX Researcher');
    expect(cv.profile.location).toBe('Stockholm, Sweden');
    expect(cv.skills).toHaveLength(6);
    expect(cv.tools.map((t) => t.name)).toEqual(['Figma', 'Miro', 'Notion']);
    expect(cv.experience.map((e) => [e.title, e.company, e.start, e.end, e.bullets.length])).toEqual([
      ['Senior UX Researcher', 'Krona Bank', 'Jan 2022', 'Present', 2],
      ['UX Researcher', 'Digital Sweden Agency', 'Sep 2018', 'Dec 2021', 1],
    ]);
    expect(cv.education.map((e) => [e.degree, e.school, e.start, e.end])).toEqual([['MSc Human-Computer Interaction', 'KTH Royal Institute of Technology', '2016', '2018']]);
    expect(cv.languages.map((l) => `${l.name}:${l.level}`)).toEqual(['Swedish:Native', 'English:C2']);
  });

  // Headings that are not in the dictionary word for word: "Relevant Experience", "Skills & Tools"…
  it('varied-headings', async () => {
    const cv = await read('varied-headings');
    expect(cv.profile.name).toBe('Marco Rossi');
    expect(cv.profile.headline).toBe('Data Analyst');
    expect(cv.profile.email).toBe('marco.rossi@mail.com');
    expect(cv.profile.location).toBe('Milan, Italy');
    expect(cv.summary).toMatch(/^Data analyst with 6 years/);
    expect(cv.experience.map((e) => [e.title, e.company, e.location, e.start, e.end, e.bullets.length])).toEqual([
      ['Senior Data Analyst', 'Esselunga', 'Milan, Italy', 'Feb 2021', 'Present', 2],
      ['Data Analyst', 'DHL', 'Bologna, Italy', 'Sep 2018', 'Jan 2021', 1],
    ]);
    expect(cv.skills).toEqual(['SQL', 'Python', 'Data visualisation', 'Forecasting']);
    expect(cv.education.map((e) => [e.degree, e.school, e.start, e.end])).toEqual([['MSc Statistics', 'Università di Bologna', '2016', '2018']]);
    expect(cv.languages.map((l) => `${l.name}:${l.level}`)).toEqual(['Italian:Native', 'English:C1']);
  });

  // LinkedIn's "Save to PDF": sidebar with Contact / Top Skills / Languages; company, title, dates with a duration, place.
  it('linkedin', async () => {
    const cv = await read('linkedin');
    expect(cv.profile.name).toBe('Jane Smith');
    expect(cv.profile.headline).toBe('Senior Product Designer at Doctolib');
    expect(cv.profile.email).toBe('jane.smith@mail.com');
    expect(cv.profile.linkedin).toMatch(/linkedin\.com\/in\/janesmith/);
    expect(cv.summary).toMatch(/^Product designer since 2015/);
    expect(cv.experience.map((e) => [e.title, e.company, e.location, e.start, e.end, e.bullets.length])).toEqual([
      ['Senior Product Designer', 'Doctolib', 'Paris, Île-de-France, France', 'March 2023', 'Present', 1],
      ['Product Designer', 'Qonto', 'Paris', 'January 2019', 'February 2023', 1],
    ]);
    expect(cv.skills).toEqual(['Design Systems', 'User Research', 'Prototyping']);
    expect(cv.languages.map((l) => `${l.name}:${l.level}`)).toEqual(['Italian:Native or Bilingual', 'English:Full Professional']);
    expect(cv.education.map((e) => [e.degree, e.school, e.start, e.end])).toEqual([["Master's degree, Visual Design", 'ISIA Urbino', '2010', '2013']]);
  });

  // Dates on their own line above each title, Spanish headings.
  it('dates-first', async () => {
    const cv = await read('dates-first');
    expect(cv.profile.name).toBe('Lucía Fernández');
    expect(cv.profile.headline).toBe('Primary School Teacher');
    expect(cv.summary).toMatch(/^Teacher with 9 years/);
    expect(cv.experience.map((e) => [e.title, e.company, e.location, e.start, e.end, e.bullets.length])).toEqual([
      ['Class Teacher, Years 3–5', 'CEIP Ausiàs March', 'Valencia', '2019', 'Actualidad', 1],
      ['Support Teacher', 'CEIP Lluís Vives', 'Valencia', '2015', '2019', 1],
    ]);
    expect(cv.education.map((e) => [e.degree, e.school, e.start, e.end])).toEqual([['Grado en Maestro de Educación Primaria', 'Universitat de València', '2010', '2014']]);
    expect(cv.languages.map((l) => l.name)).toEqual(['Spanish', 'Valencian', 'English']);
  });
});
