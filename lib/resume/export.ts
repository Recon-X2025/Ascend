/**
 * Resume export to PDF and DOCX. Fetches ResumeVersion + CareerIntent from DB, renders with template.
 */

import { prisma } from "@/lib/prisma/client";
import { getSectionOrder, type TemplateId, type TargetLevel } from "./templates/types";
import type { ContentSnapshot } from "@/store/resume-build";
import { PDFDocument, StandardFonts } from "pdf-lib";
import {
  Document,
  Packer,
  Paragraph,
  TextRun,
  HeadingLevel,
  convertInchesToTwip,
} from "docx";

const TEMPLATE_IDS = ["classic", "modern", "executive", "tech", "creative-professional", "international"] as const;
function toTemplateId(s: string | null): TemplateId {
  if (s && TEMPLATE_IDS.includes(s as TemplateId)) return s as TemplateId;
  return "classic";
}

export interface ExportContact {
  name?: string | null;
  email?: string | null;
  phone?: string | null;
  location?: string | null;
}

/**
 * Fetch version and related data. Caller must ensure version.userId === requesting userId.
 */
export async function getVersionForExport(versionId: string) {
  const version = await prisma.resumeVersion.findUnique({
    where: { id: versionId },
    include: {
      careerIntent: true,
      user: { include: { jobSeekerProfile: true } },
    },
  });
  if (!version) return null;
  const profile = version.user.jobSeekerProfile;
  if (!profile) return { version, intent: version.careerIntent, contact: null as ExportContact | null };
  const contact: ExportContact = {
    name: version.user.name ?? null,
    email: version.user.email ?? null,
    phone: null,
    location: [profile.city, profile.state, profile.country].filter(Boolean).join(", ") || null,
  };
  return { version, intent: version.careerIntent, contact };
}

/**
 * Export resume to PDF. Returns buffer; stream as application/pdf.
 */
export async function exportToPDF(versionId: string): Promise<{ buffer: Buffer; filename: string }> {
  const data = await getVersionForExport(versionId);
  if (!data) throw new Error("Resume version not found");
  const { version, intent, contact } = data;
  const snapshot = version.contentSnapshot as ContentSnapshot | null;
  if (!snapshot?.experiences) throw new Error("Resume content is empty");

  const doc = await PDFDocument.create();
  const font = await doc.embedFont(StandardFonts.Helvetica);
  const fontBold = await doc.embedFont(StandardFonts.HelveticaBold);
  const pages = [doc.addPage([612, 792])];
  let currentPage = pages[0];
  const margin = 72;
  let y = currentPage.getHeight() - margin;
  const lineHeight = 14;
  const fontSize = 11;
  const headingSize = 12;

  function drawText(text: string, opts: { bold?: boolean; size?: number } = {}) {
    const f = opts.bold ? fontBold : font;
    const size = opts.size ?? fontSize;
    if (y < margin + lineHeight) {
      const newPage = doc.addPage([612, 792]);
      pages.push(newPage);
      currentPage = newPage;
      y = currentPage.getHeight() - margin;
    }
    currentPage.drawText(text, { x: margin, y, size, font: f });
    y -= size + 2;
  }

  const parts = [contact?.name, contact?.email, contact?.phone, contact?.location].filter(Boolean);
  if (parts.length > 0) {
    currentPage.drawText(parts.join(" · "), { x: margin, y, size: fontSize, font });
    y -= lineHeight + 4;
  }

  const templateId = toTemplateId(version.templateId);
  const order = getSectionOrder(templateId, intent.targetLevel as TargetLevel);

  for (const key of order) {
    if (key === "summary") {
      const text =
        snapshot.summaries?.[snapshot.selectedSummaryIndex ?? 0] ?? "";
      if (text.trim()) {
        drawText("SUMMARY", { bold: true, size: headingSize });
        y -= 2;
        const lines = text.split(/\n/);
        for (const line of lines) {
          drawText(line.trim() || " ");
        }
        y -= 6;
      }
    } else if (key === "experience") {
      const experiences = snapshot.experiences ?? {};
      const entries = Object.values(experiences);
      if (entries.length > 0) {
        drawText("EXPERIENCE", { bold: true, size: headingSize });
        y -= 2;
        for (const exp of entries) {
          const title = [exp.designation ?? "Role", exp.company].filter(Boolean).join(", ");
          drawText(title, { bold: true });
          for (const b of exp.rewrittenBullets ?? []) {
            drawText(`• ${b}`);
          }
          y -= 4;
        }
        y -= 4;
      }
    } else if (key === "skills") {
      const skills = snapshot.skills;
      if (skills) {
        const all = [
          ...(skills.core ?? []),
          ...(skills.technical ?? []),
          ...(skills.soft ?? []),
          ...(skills.tools ?? []),
        ].filter(Boolean);
        if (all.length > 0) {
          drawText("SKILLS", { bold: true, size: headingSize });
          y -= 2;
          drawText(all.join(" · "));
          y -= 6;
        }
      }
    }
  }

  const bytes = await doc.save();
  const buffer = Buffer.from(bytes);
  const safeName = (version.name || "resume").replace(/[^a-zA-Z0-9-_]/g, "-");
  return { buffer, filename: `${safeName}-resume.pdf` };
}

/**
 * Export resume to DOCX. Respects template section order and ATS formatting.
 */
export async function exportToDOCX(versionId: string): Promise<{ buffer: Buffer; filename: string }> {
  const data = await getVersionForExport(versionId);
  if (!data) throw new Error("Resume version not found");
  const { version, intent, contact } = data;
  const snapshot = version.contentSnapshot as ContentSnapshot | null;
  if (!snapshot?.experiences) throw new Error("Resume content is empty");

  const templateId = toTemplateId(version.templateId);
  const order = getSectionOrder(templateId, intent.targetLevel as TargetLevel);
  const children: Paragraph[] = [];

  const contactParts = [contact?.name, contact?.email, contact?.phone, contact?.location].filter(Boolean);
  if (contactParts.length > 0) {
    children.push(
      new Paragraph({
        children: [new TextRun({ text: contactParts.join(" · "), size: 22 })],
        spacing: { after: 200 },
      })
    );
  }

  for (const key of order) {
    if (key === "summary") {
      const text = snapshot.summaries?.[snapshot.selectedSummaryIndex ?? 0] ?? "";
      if (text.trim()) {
        children.push(
          new Paragraph({
            children: [new TextRun({ text: "Summary", bold: true, size: 24 })],
            heading: HeadingLevel.HEADING_2,
            spacing: { before: 240, after: 120 },
          })
        );
        children.push(
          new Paragraph({
            children: [new TextRun({ text, size: 22 })],
            spacing: { after: 200 },
          })
        );
      }
    } else if (key === "experience") {
      const experiences = snapshot.experiences ?? {};
      const entries = Object.values(experiences);
      if (entries.length > 0) {
        children.push(
          new Paragraph({
            children: [new TextRun({ text: "Experience", bold: true, size: 24 })],
            heading: HeadingLevel.HEADING_2,
            spacing: { before: 240, after: 120 },
          })
        );
        for (const exp of entries) {
          const title = [exp.designation ?? "Role", exp.company].filter(Boolean).join(", ");
          children.push(
            new Paragraph({
              children: [new TextRun({ text: title, bold: true, size: 22 })],
              spacing: { after: 80 },
            })
          );
          for (const b of exp.rewrittenBullets ?? []) {
            children.push(
              new Paragraph({
                children: [new TextRun({ text: `• ${b}`, size: 22 })],
                indent: { left: convertInchesToTwip(0.25) },
                spacing: { after: 60 },
              })
            );
          }
          children.push(new Paragraph({ spacing: { after: 120 } }));
        }
      }
    } else if (key === "skills") {
      const skills = snapshot.skills;
      if (skills) {
        const all = [
          ...(skills.core ?? []),
          ...(skills.technical ?? []),
          ...(skills.soft ?? []),
          ...(skills.tools ?? []),
        ].filter(Boolean);
        if (all.length > 0) {
          children.push(
            new Paragraph({
              children: [new TextRun({ text: "Skills", bold: true, size: 24 })],
              heading: HeadingLevel.HEADING_2,
              spacing: { before: 240, after: 120 },
            })
          );
          children.push(
            new Paragraph({
              children: [new TextRun({ text: all.join(" · "), size: 22 })],
              spacing: { after: 200 },
            })
          );
        }
      }
    }
  }

  const doc = new Document({
    sections: [{ properties: {}, children }],
  });

  const buffer = Buffer.from(await Packer.toBuffer(doc));
  const safeName = (version.name || "resume").replace(/[^a-zA-Z0-9-_]/g, "-");
  return { buffer, filename: `${safeName}-resume.docx` };
}
