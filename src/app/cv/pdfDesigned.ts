// "As on the page" PDF: the same layout, typefaces, paper colour, rules, logos and photo as the
// screen, with real selectable text. Fonts are the OFL files in /public/fonts, embedded on demand.
import { contactItems, dateRange } from './format';
import type { CVData } from './types';
import type { Messages } from '../i18n/en';
import type { TypeStyle } from '../typography';

const W = 595.28; // A4 in points
const H = 841.89;
const M = 48;
const CW = W - M * 2;
const C = { paper: '#ECEAE5', ink: '#111111', soft: '#45433F', rule: '#CFCCC5' };

const families = {
  sans: { name: 'InterTight', file: 'InterTight' },
  serif: { name: 'Literata', file: 'Literata' },
  mono: { name: 'IBMPlexMono', file: 'IBMPlexMono' },
} as const;

const fontCache = new Map<string, Promise<string>>();
function fontBase64(file: string) {
  if (!fontCache.has(file)) {
    const url = new URL(`../fonts/${file}.ttf`, window.location.href).href;
    fontCache.set(
      file,
      fetch(url)
        .then((r) => {
          if (!r.ok) throw new Error(`font ${file}`);
          return r.arrayBuffer();
        })
        .then((buf) => {
          const bytes = new Uint8Array(buf);
          let bin = '';
          for (let i = 0; i < bytes.length; i += 0x8000) bin += String.fromCharCode(...bytes.subarray(i, i + 0x8000));
          return btoa(bin);
        }),
    );
  }
  return fontCache.get(file)!;
}

/** SVG/raster logo → PNG data URL the PDF can embed. */
async function rasterize(src: string, px = 96): Promise<string | undefined> {
  try {
    const img = await new Promise<HTMLImageElement>((resolve, reject) => {
      const el = new Image();
      el.onload = () => resolve(el);
      el.onerror = reject;
      el.src = src;
    });
    const canvas = document.createElement('canvas');
    canvas.width = px;
    canvas.height = px;
    const ctx = canvas.getContext('2d')!;
    const w = img.naturalWidth || px;
    const h = img.naturalHeight || px;
    const k = Math.min(px / w, px / h);
    ctx.drawImage(img, (px - w * k) / 2, (px - h * k) / 2, w * k, h * k);
    return canvas.toDataURL('image/png');
  } catch {
    return undefined;
  }
}

export async function buildDesignedPdf(cv: CVData, m: Messages, type: TypeStyle): Promise<Blob> {
  const { jsPDF } = await import('jspdf');
  const doc = new jsPDF({ unit: 'pt', format: 'a4', compress: true });

  // Fonts: the reading family plus Inter Tight (meta lines) and Plex Mono (labels).
  const needed = new Set([families[type].file, 'InterTight', 'IBMPlexMono']);
  for (const file of needed) {
    for (const [suffix, style] of [['Regular', 'normal'], ['Medium', 'bold'], ['Italic', 'italic']] as const) {
      const data = await fontBase64(`${file}-${suffix}`);
      doc.addFileToVFS(`${file}-${suffix}.ttf`, data);
      doc.addFont(`${file}-${suffix}.ttf`, file, style);
    }
  }
  const READ = families[type].name;
  const SANS = 'InterTight';
  const MONO = 'IBMPlexMono';

  // Logos and photo as embeddable images.
  const toolIcons = await Promise.all(cv.tools.map((t) => (t.icon ? rasterize(t.icon, 64) : Promise.resolve(undefined))));
  const expLogos = await Promise.all(cv.experience.map((e) => (e.logo ? rasterize(e.logo, 96) : Promise.resolve(undefined))));

  let y = M;
  const paint = () => {
    doc.setFillColor(C.paper);
    doc.rect(0, 0, W, H, 'F');
  };
  paint();
  const ensure = (h: number) => {
    if (y + h > H - M) {
      doc.addPage();
      paint();
      y = M;
    }
  };
  const font = (family: string, size: number, style: 'normal' | 'bold' | 'italic' = 'normal', color = C.ink) => {
    doc.setFont(family, style);
    doc.setFontSize(size);
    doc.setTextColor(color);
  };
  const label = (text: string, x: number, yy: number, color = C.soft, size = 7.5, align: 'left' | 'right' = 'left') => {
    font(MONO, size, 'normal', color);
    doc.text(text.toUpperCase(), x, yy, { charSpace: size * 0.14, align });
  };
  const para = (text: string, family: string, size: number, opts: { color?: string; width?: number; x?: number; lead?: number; style?: 'normal' | 'bold' | 'italic' } = {}) => {
    font(family, size, opts.style ?? 'normal', opts.color ?? C.ink);
    const lines: string[] = doc.splitTextToSize(text, opts.width ?? CW);
    const lh = size * (opts.lead ?? 1.4);
    for (const line of lines) {
      ensure(lh);
      doc.text(line, opts.x ?? M, y + size * 0.85);
      y += lh;
    }
  };
  const hline = (x1: number, x2: number, yy: number, color = C.rule, w = 0.5) => {
    doc.setDrawColor(color);
    doc.setLineWidth(w);
    doc.line(x1, yy, x2, yy);
  };
  let section = 0;
  const head = (title: string) => {
    ensure(70);
    y += 26;
    hline(M, W - M, y, C.ink, 0.8);
    y += 13;
    font(MONO, 8, 'bold', C.ink);
    doc.text(title.toUpperCase(), M, y, { charSpace: 1.1 });
    label(String(++section).padStart(2, '0'), W - M, y, C.soft, 7.5, 'right');
    y += 16;
  };

  // ---- Header: label, name, headline, contacts, square photo ----
  const { profile } = cv;
  const photoSize = 76;
  const textWidth = profile.photo ? CW - photoSize - 20 : CW;
  label(m.app.cvTitle, M, y + 6);
  if (profile.photo) doc.addImage(profile.photo, 'JPEG', W - M - photoSize, y, photoSize, photoSize);
  y += 18;
  font(READ, 34, 'normal');
  const nameLines: string[] = doc.splitTextToSize(profile.name || m.app.namePlaceholder, textWidth);
  for (const line of nameLines) {
    doc.text(line, M, y + 28);
    y += 33;
  }
  y += 4;
  para(profile.headline || m.app.headlinePlaceholder, READ, 13, { color: C.soft, width: textWidth });
  y += 8;
  para(contactItems(cv).join('   ·   '), SANS, 8.5, { color: C.soft, width: textWidth });
  if (profile.photo) y = Math.max(y, M + photoSize + 4);

  // ---- Summary ----
  if (cv.summary.trim()) {
    head(m.sections.summary);
    para(cv.summary.trim(), READ, 11, { width: Math.min(CW, 440), lead: 1.5 });
  }

  // ---- Skills: outlined pills + tool grid ----
  if (cv.skills.length || cv.tools.length) {
    head(m.sections.skills);
    if (cv.skills.length) {
      label(m.sections.coreSkills, M, y + 6);
      y += 14;
      font(READ, 9.5);
      let x = M;
      const ph = 18;
      for (const s of cv.skills) {
        const w = doc.getTextWidth(s) + 14;
        if (x + w > W - M) {
          x = M;
          y += ph + 5;
        }
        ensure(ph + 5);
        doc.setDrawColor(C.ink);
        doc.setLineWidth(0.6);
        doc.rect(x, y, w, ph);
        doc.text(s, x + 7, y + 12.3);
        x += w + 5;
      }
      y += ph + 18;
    }
    if (cv.tools.length) {
      label(m.sections.tools, M, y + 6);
      y += 14;
      const cols = 3;
      const cw = CW / cols;
      const ch = 34;
      cv.tools.forEach((t, i) => {
        const col = i % cols;
        if (col === 0) {
          ensure(ch);
          if (i > 0) y += ch;
        }
        const x = M + col * cw;
        doc.setDrawColor(C.rule);
        doc.setLineWidth(0.5);
        doc.rect(x, y, cw, ch);
        const icon = toolIcons[i];
        if (icon) doc.addImage(icon, 'PNG', x + 9, y + 10, 13, 13);
        else {
          doc.setFillColor(C.ink);
          doc.rect(x + 9, y + 10, 13, 13, 'F');
          font(READ, 8, 'normal', C.paper);
          doc.text(t.name.charAt(0).toUpperCase(), x + 15.5, y + 19.5, { align: 'center' });
        }
        font(READ, 9.5, 'bold');
        doc.text(doc.splitTextToSize(t.name, cw - 36)[0] ?? '', x + 29, y + 15);
        if (t.description) {
          font(SANS, 7.5, 'normal', C.soft);
          doc.text(doc.splitTextToSize(t.description, cw - 36)[0] ?? '', x + 29, y + 25);
        }
      });
      y += ch;
    }
  }

  // ---- Experience: ruled entries with logo tiles ----
  if (cv.experience.length) {
    head(m.sections.experience);
    cv.experience.forEach((e, i) => {
      ensure(70);
      if (i > 0) {
        hline(M, W - M, y);
        y += 16;
      }
      const tx = M + 38;
      const logo = expLogos[i];
      if (logo) doc.addImage(logo, 'PNG', M, y, 26, 26);
      else {
        doc.setFillColor(C.ink);
        doc.rect(M, y, 26, 26, 'F');
        font(READ, 12, 'normal', C.paper);
        doc.text((e.company || '?').charAt(0).toUpperCase(), M + 13, y + 17.5, { align: 'center' });
      }
      const dates = dateRange(e.start, e.end);
      font(MONO, 8, 'normal', C.soft);
      const dw = dates ? doc.getTextWidth(dates) + 12 : 0;
      if (dates) doc.text(dates, W - M, y + 11, { align: 'right' });
      const top = y;
      para(e.title, READ, 13, { width: CW - 38 - dw, x: tx, lead: 1.25, style: 'bold' });
      y = Math.max(y, top + 17);
      para([e.company, e.location, e.employmentType].filter(Boolean).join(' · '), SANS, 8.5, { color: C.soft, x: tx, width: CW - 38 });
      y += 5;
      e.bullets.filter((b) => b.trim()).forEach((b) => {
        font(READ, 10);
        const lines: string[] = doc.splitTextToSize(b.trim(), CW - 38 - 12);
        lines.forEach((line, j) => {
          ensure(14.5);
          if (j === 0) {
            font(READ, 10, 'normal', C.soft);
            doc.text('–', tx, y + 8.5);
            font(READ, 10);
          }
          doc.text(line, tx + 12, y + 8.5);
          y += 14.5;
        });
      });
      y += 10;
    });
  }

  // ---- Education & certifications: ruled rows ----
  const rows = (title: string, items: { title: string; meta: string; year: string }[]) => {
    if (!items.length) return;
    head(title);
    items.forEach((it, i) => {
      ensure(40);
      if (i > 0) {
        hline(M, W - M, y);
        y += 12;
      }
      if (it.year) {
        font(MONO, 8, 'normal', C.soft);
        doc.text(it.year, W - M, y + 9, { align: 'right' });
      }
      para(it.title, READ, 11.5, { width: CW - 90, style: 'bold', lead: 1.3 });
      if (it.meta) para(it.meta, SANS, 8.5, { color: C.soft, width: CW - 90 });
      y += 8;
    });
  };
  rows(m.sections.education, cv.education.map((e) => ({ title: e.degree, meta: [e.school, e.location, e.details].filter(Boolean).join(' · '), year: dateRange(e.start, e.end) })));
  rows(m.sections.certifications, cv.certifications.map((c) => ({ title: c.title, meta: [c.description, c.issuer].filter(Boolean).join(' · '), year: c.year })));

  // ---- Languages: hairline grid ----
  if (cv.languages.length) {
    head(m.sections.languages);
    const cols = 3;
    const cw = CW / cols;
    const ch = 40;
    cv.languages.forEach((l, i) => {
      const col = i % cols;
      if (col === 0) {
        ensure(ch);
        if (i > 0) y += ch;
      }
      const x = M + col * cw;
      doc.setDrawColor(C.rule);
      doc.setLineWidth(0.5);
      doc.rect(x, y, cw, ch);
      font(READ, 12);
      doc.text(l.name, x + 10, y + 17);
      if (l.level) label(l.level, x + 10, y + 30);
    });
    y += ch;
  }

  // Running footer on every page.
  const pages = doc.getNumberOfPages();
  for (let i = 1; i <= pages; i++) {
    doc.setPage(i);
    hline(M, W - M, H - 30, C.rule);
    label('curriculi curricula', M, H - 18);
    label(`${i} / ${pages}`, W - M, H - 18, C.soft, 7.5, 'right');
  }

  doc.setProperties({
    title: [profile.name, profile.headline, m.app.cvTitle].filter(Boolean).join(' - '),
    author: profile.name,
    subject: profile.headline,
    keywords: [...cv.skills, ...cv.tools.map((t) => t.name)].join(', '),
    creator: 'curriculi curricula',
  });
  return doc.output('blob');
}
