import { jsPDF } from 'jspdf';
import type { resumeSkillGroupKeys } from '../i18n/resumeHelpers';
import type { Translation } from '../i18n/types';

export type ResumePdfContent = {
  name: string;
  email: string;
  website: string;
  phone: string;
  title: string;
  subtitle: string;
  location: string;
  summary: string;
  experience: Array<{
    title: string;
    company: string;
    period: string;
    engagements: Array<{
      client: string;
      role: string;
      project: string;
      achievements: readonly string[];
    }>;
  }>;
  projects: Array<{
    title: string;
    category: string;
    description: string;
    stack: readonly string[];
  }>;
  education: Array<{
    degree: string;
    institution: string;
    period: string;
  }>;
  skills: Array<{ items: readonly string[] }>;
  certifications: Array<{ issuer: string; name: string; year: string }>;
};

export type ResumePdfLabels = {
  sections: Translation['resumePrint']['sections'];
  stack: string;
  skillGroups: Translation['skills']['groups'];
  skillGroupKeys: typeof resumeSkillGroupKeys;
};

type ExportResumePdfOptions = {
  filename?: string;
};

const MARGIN = 15;
const BOTTOM = 15;

function lineHeight(fontSize: number) {
  return fontSize * 0.42;
}

function createWriter(doc: jsPDF) {
  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const contentWidth = pageWidth - MARGIN * 2;
  let y = MARGIN;

  const newPage = () => {
    doc.addPage();
    y = MARGIN;
  };

  const ensure = (height: number) => {
    if (y + height > pageHeight - BOTTOM) {
      newPage();
    }
  };

  const setStyle = (opts: { bold?: boolean; italic?: boolean; size?: number; color?: [number, number, number] }) => {
    doc.setFont('helvetica', opts.bold ? 'bold' : opts.italic ? 'italic' : 'normal');
    doc.setFontSize(opts.size ?? 10);
    doc.setTextColor(...(opts.color ?? [26, 26, 26]));
  };

  const writeLines = (
    text: string,
    opts: { bold?: boolean; italic?: boolean; size?: number; color?: [number, number, number]; gap?: number } = {},
  ) => {
    if (!text.trim()) return;

    setStyle(opts);
    const lines = doc.splitTextToSize(text, contentWidth) as string[];
    const lh = lineHeight(opts.size ?? 10);

    for (const line of lines) {
      ensure(lh);
      doc.text(line, MARGIN, y);
      y += lh;
    }

    y += opts.gap ?? 2;
  };

  const writeRow = (
    left: string,
    right: string,
    opts: { size?: number; boldLeft?: boolean } = {},
  ) => {
    const size = opts.size ?? 10;
    const lh = lineHeight(size);
    ensure(lh);

    setStyle({ size, bold: opts.boldLeft });
    doc.text(left, MARGIN, y);

    setStyle({ size, color: [68, 68, 68] });
    doc.text(right, pageWidth - MARGIN, y, { align: 'right' });

    y += lh + 1;
  };

  const sectionHeading = (title: string) => {
    ensure(12);
    y += 3;
    doc.setDrawColor(204, 204, 204);
    doc.line(MARGIN, y, MARGIN + contentWidth, y);
    y += 5;
    writeLines(title, { size: 10, bold: true, gap: 2 });
  };

  const bulletList = (items: readonly string[], opts: { size?: number } = {}) => {
    const size = opts.size ?? 10;
    const lh = lineHeight(size);

    for (const item of items) {
      setStyle({ size, color: [51, 51, 51] });
      const lines = doc.splitTextToSize(`• ${item}`, contentWidth - 4) as string[];

      for (const line of lines) {
        ensure(lh);
        doc.text(line, MARGIN + 2, y);
        y += lh;
      }

      y += 1;
    }
  };

  const spacer = (mm: number) => {
    y += mm;
  };

  return { writeLines, writeRow, sectionHeading, bulletList, spacer, ensure };
}

export function exportResumePdf(
  content: ResumePdfContent,
  labels: ResumePdfLabels,
  { filename = 'Sidnei-Almeida-Resume.pdf' }: ExportResumePdfOptions = {},
): void {
  const doc = new jsPDF({ unit: 'mm', format: 'a4', orientation: 'portrait' });
  const w = createWriter(doc);

  w.writeLines(content.name, { size: 22, bold: true, gap: 1 });
  w.writeLines(content.title, { size: 11, bold: true, gap: 0.5 });
  w.writeLines(content.subtitle, { size: 10, color: [68, 68, 68], gap: 2 });
  w.writeLines(`${content.location} | ${content.email}`, { size: 9.5, color: [68, 68, 68], gap: 0.5 });
  w.writeLines(`${content.website} | ${content.phone}`, { size: 9.5, color: [68, 68, 68], gap: 4 });

  w.sectionHeading(labels.sections.summary);
  w.writeLines(content.summary, { size: 10.5, color: [51, 51, 51], gap: 2 });

  w.sectionHeading(labels.sections.experience);
  for (const entry of content.experience) {
    w.writeRow(entry.title, entry.period, { size: 11, boldLeft: true });
    w.writeLines(entry.company, { size: 10, color: [85, 85, 85], gap: 2 });

    for (const engagement of entry.engagements) {
      w.writeLines(engagement.client, { size: 10.5, bold: true, gap: 0.5 });
      w.writeLines(engagement.role, { size: 10, italic: true, color: [85, 85, 85], gap: 0.5 });
      w.writeLines(engagement.project, { size: 10, color: [68, 68, 68], gap: 1 });
      w.bulletList(engagement.achievements);
      w.spacer(2);
    }

    w.spacer(2);
  }

  w.sectionHeading(labels.sections.projects);
  for (const project of content.projects) {
    w.writeRow(project.title, project.category, { size: 10.5, boldLeft: true });
    w.writeLines(project.description, { size: 10, color: [51, 51, 51], gap: 0.5 });
    w.writeLines(`${labels.stack}: ${project.stack.join(', ')}`, {
      size: 10,
      italic: true,
      color: [85, 85, 85],
      gap: 3,
    });
  }

  w.sectionHeading(labels.sections.education);
  for (const entry of content.education) {
    w.writeRow(entry.degree, entry.period, { size: 10.5, boldLeft: true });
    w.writeLines(entry.institution, { size: 10, color: [85, 85, 85], gap: 2 });
  }

  w.sectionHeading(labels.sections.skills);
  labels.skillGroupKeys.forEach((key, index) => {
    const items = content.skills[index]?.items ?? [];
    w.writeLines(`${labels.skillGroups[key]}: ${items.join(', ')}`, { size: 10, color: [51, 51, 51], gap: 2 });
  });

  w.sectionHeading(labels.sections.certifications);
  for (const cert of content.certifications) {
    w.writeRow(`${cert.issuer}, ${cert.name}`, cert.year, { size: 10 });
  }

  doc.save(filename);
}
