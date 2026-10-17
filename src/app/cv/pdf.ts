// Builds an ATS-friendly PDF directly in the browser: one column, real selectable text in Helvetica,
// standard headings, contact details in the body and document metadata (title, author, keywords).
// No print dialog, so no browser headers/footers end up in the text.
import { contactItems, dateRange } from './format';
import type { CVData } from './types';
import type { Messages } from '../i18n/en';

const PAGE = { margin: 50, width: 595.28, height: 841.89 }; // A4 in points

export async function buildPdf(cv: CVData, m: Messages): Promise<Blob> {
  const { jsPDF } = await import('jspdf');
  const doc = new jsPDF({ unit: 'pt', format: 'a4', compress: true });
  const contentWidth = PAGE.width - PAGE.margin * 2;
  let y = PAGE.margin;

  const ensureSpace = (needed: number) => {
    if (y + needed > PAGE.height - PAGE.margin) {
      doc.addPage();
      y = PAGE.margin;
    }
  };
  const text = (value: string, opts: { size: number; bold?: boolean; indent?: number; gap?: number; color?: number }) => {
    doc.setFont('helvetica', opts.bold ? 'bold' : 'normal');
    doc.setFontSize(opts.size);
    doc.setTextColor(opts.color ?? 20);
    const indent = opts.indent ?? 0;
    const lines: string[] = doc.splitTextToSize(value, contentWidth - indent);
    const lineHeight = opts.size * 1.35;
    for (const line of lines) {
      ensureSpace(lineHeight);
      doc.text(line, PAGE.margin + indent, y + opts.size);
      y += lineHeight;
    }
    y += opts.gap ?? 0;
  };
  const heading = (title: string) => {
    ensureSpace(40);
    y += 10;
    text(title.toUpperCase(), { size: 11, bold: true });
    doc.setDrawColor(20);
    doc.setLineWidth(0.6);
    doc.line(PAGE.margin, y, PAGE.width - PAGE.margin, y);
    y += 8;
  };
  /** Bold title on the left, dates right-aligned on the same line. */
  const titleRow = (title: string, right: string) => {
    doc.setFontSize(10.5);
    doc.setFont('helvetica', 'normal');
    const rightWidth = right ? doc.getTextWidth(right) + 12 : 0;
    doc.setFont('helvetica', 'bold');
    const lines: string[] = doc.splitTextToSize(title, contentWidth - rightWidth);
    ensureSpace(lines.length * 14 + 14);
    lines.forEach((line, i) => {
      doc.setFont('helvetica', 'bold');
      doc.text(line, PAGE.margin, y + 10.5);
      if (i === 0 && right) {
        doc.setFont('helvetica', 'normal');
        doc.text(right, PAGE.width - PAGE.margin, y + 10.5, { align: 'right' });
      }
      y += 14;
    });
  };
  const bullet = (value: string) => {
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(10);
    const lines: string[] = doc.splitTextToSize(value, contentWidth - 14);
    lines.forEach((line, i) => {
      ensureSpace(13.5);
      if (i === 0) doc.text('•', PAGE.margin + 3, y + 10);
      doc.text(line, PAGE.margin + 14, y + 10);
      y += 13.5;
    });
  };

  const { profile } = cv;
  text(profile.name, { size: 20, bold: true });
  if (profile.headline) text(profile.headline, { size: 12, color: 60 });
  y += 2;
  text(contactItems(cv).join('  |  '), { size: 9.5, color: 40, gap: 4 });

  if (cv.summary.trim()) {
    heading(m.sections.summary);
    text(cv.summary.trim(), { size: 10 });
  }

  if (cv.skills.length || cv.tools.length) {
    heading(m.sections.skills);
    if (cv.skills.length) text(`${m.sections.coreSkills}: ${cv.skills.join(', ')}`, { size: 10, gap: 2 });
    if (cv.tools.length) text(`${m.sections.toolsShort}: ${cv.tools.map((t) => t.name).join(', ')}`, { size: 10 });
  }

  if (cv.experience.length) {
    heading(m.sections.experience);
    cv.experience.forEach((e, i) => {
      if (i) y += 6;
      titleRow(e.title, dateRange(e.start, e.end));
      text([e.company, e.location, e.employmentType].filter(Boolean).join(' | '), { size: 10, color: 50, gap: 2 });
      e.bullets.filter((b) => b.trim()).forEach((b) => bullet(b.trim()));
    });
  }

  if (cv.education.length) {
    heading(m.sections.education);
    cv.education.forEach((e) => {
      titleRow(e.degree, dateRange(e.start, e.end));
      text([e.school, e.location].filter(Boolean).join(' | '), { size: 10, color: 50 });
      if (e.details.trim()) text(e.details.trim(), { size: 10 });
      y += 4;
    });
  }

  if (cv.certifications.length) {
    heading(m.sections.certifications);
    cv.certifications.forEach((c) =>
      bullet(`${c.title}${c.description ? ` (${c.description})` : ''}${c.issuer ? `, ${c.issuer}` : ''}${c.year ? `, ${c.year}` : ''}`),
    );
  }

  if (cv.languages.length) {
    heading(m.sections.languages);
    text(cv.languages.map((l) => (l.level ? `${l.name} (${l.level})` : l.name)).join(', '), { size: 10 });
  }

  doc.setProperties({
    title: [profile.name, profile.headline, m.app.cvTitle].filter(Boolean).join(' - '),
    author: profile.name,
    subject: profile.headline,
    keywords: [...cv.skills, ...cv.tools.map((t) => t.name)].join(', '),
    creator: 'careerpath.CV',
  });
  return doc.output('blob');
}
