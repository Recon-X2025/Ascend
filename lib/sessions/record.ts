/**
 * M-7: Session Record — PDF generation, S3 upload, SHA-256 integrity.
 */

import { createHash } from "crypto";
import { PDFDocument, StandardFonts, rgb, type PDFFont, type PDFPage } from "pdf-lib";
import { prisma } from "@/lib/prisma/client";
import { storeFile } from "@/lib/storage";

const MARGIN = 50;
const LINE_HEIGHT = 14;

function drawLine(page: PDFPage, font: PDFFont, text: string, x: number, y: number, size = 10): number {
  page.drawText(text, { x, y, size, font, color: rgb(0.1, 0.1, 0.1) });
  return y - size - 2;
}

/** Generate Session Record PDF. */
export async function generateSessionRecord(sessionId: string): Promise<Buffer> {
  const session = await prisma.engagementSession.findUnique({
    where: { id: sessionId },
    include: {
      contract: { include: { mentor: true, mentee: true } },
      stenoExtractions: { orderBy: { createdAt: "desc" }, take: 1 },
      transcripts: { orderBy: { createdAt: "desc" }, take: 1 },
    },
  });
  if (!session) throw new Error("Session not found");

  const extraction = session.stenoExtractions[0];
  const transcript = session.transcripts[0];
  const doc = await PDFDocument.create();
  const font = await doc.embedFont(StandardFonts.Helvetica);
  const fontBold = await doc.embedFont(StandardFonts.HelveticaBold);
  const page = doc.addPage([595, 842]);

  let y = 842 - MARGIN;

  page.drawText("Ascend Session Record", {
    x: MARGIN,
    y,
    size: 18,
    font: fontBold,
    color: rgb(0.06, 0.1, 0.06),
  });
  y -= 24;

  y = drawLine(page, font, `Session #${session.sessionNumber} — ${session.scheduledAt?.toISOString().slice(0, 16) ?? "—"}`, MARGIN, y);
  y = drawLine(page, font, `Mentor: ${session.contract.mentor.name ?? session.contract.mentor.email}`, MARGIN, y);
  y = drawLine(page, font, `Mentee: ${session.contract.mentee.name ?? session.contract.mentee.email}`, MARGIN, y);
  y -= 12;

  if (extraction) {
    page.drawText("Summary", { x: MARGIN, y, size: 12, font: fontBold, color: rgb(0.1, 0.1, 0.1) });
    y -= LINE_HEIGHT;
    if (extraction.summary) {
      const lines = extraction.summary.split(/\n/).flatMap((l) => (l.length > 80 ? l.match(/.{1,80}(\s|$)/g) ?? [l] : [l]));
      for (const line of lines) {
        y = drawLine(page, font, line, MARGIN, y);
        if (y < MARGIN) break;
      }
    }
    y -= 12;

    const arr = (v: unknown): string[] => (Array.isArray(v) ? v.map(String) : []);
    const mentorC = arr(extraction.mentorCommitments);
    const menteeC = arr(extraction.menteeCommitments);
    const actions = arr(extraction.actionItems);

    if (mentorC.length) {
      page.drawText("Mentor commitments", { x: MARGIN, y, size: 11, font: fontBold, color: rgb(0.1, 0.1, 0.1) });
      y -= LINE_HEIGHT;
      for (const c of mentorC) {
        y = drawLine(page, font, `• ${c}`, MARGIN, y);
      }
      y -= 8;
    }
    if (menteeC.length) {
      page.drawText("Mentee commitments", { x: MARGIN, y, size: 11, font: fontBold, color: rgb(0.1, 0.1, 0.1) });
      y -= LINE_HEIGHT;
      for (const c of menteeC) {
        y = drawLine(page, font, `• ${c}`, MARGIN, y);
      }
      y -= 8;
    }
    if (actions.length) {
      page.drawText("Action items", { x: MARGIN, y, size: 11, font: fontBold, color: rgb(0.1, 0.1, 0.1) });
      y -= LINE_HEIGHT;
      for (const a of actions) {
        y = drawLine(page, font, `• ${a}`, MARGIN, y);
      }
      y -= 8;
    }
    if (extraction.nextSessionFocus) {
      page.drawText("Next session focus", { x: MARGIN, y, size: 11, font: fontBold, color: rgb(0.1, 0.1, 0.1) });
      y -= LINE_HEIGHT;
      y = drawLine(page, font, extraction.nextSessionFocus, MARGIN, y);
      y -= 8;
    }
    if (extraction.goalProgressSignal) {
      page.drawText("Goal progress", { x: MARGIN, y, size: 11, font: fontBold, color: rgb(0.1, 0.1, 0.1) });
      y -= LINE_HEIGHT;
      y = drawLine(page, font, extraction.goalProgressSignal, MARGIN, y);
    }
  } else if (transcript) {
    page.drawText("Transcript (excerpt)", { x: MARGIN, y, size: 12, font: fontBold, color: rgb(0.1, 0.1, 0.1) });
    y -= LINE_HEIGHT;
    const excerpt = transcript.content.slice(0, 2000);
    const lines = excerpt.split(/\n/).flatMap((l) => (l.length > 80 ? (l.match(/.{1,80}(\s|$)/g) ?? [l]) : [l]));
    for (const line of lines) {
      y = drawLine(page, font, line, MARGIN, y);
      if (y < MARGIN) break;
    }
  }

  y -= 24;
  page.drawText(`Generated: ${new Date().toISOString()}`, { x: MARGIN, y, size: 8, font, color: rgb(0.5, 0.5, 0.5) });

  const pdfBytes = await doc.save();
  return Buffer.from(pdfBytes);
}

/** Upload session record to storage (local or Vultr), return key. */
export async function uploadSessionRecord(sessionId: string, buffer: Buffer): Promise<string> {
  const key = `session-records/${new Date().getFullYear()}/${sessionId}.pdf`;
  await storeFile(key, buffer, "application/pdf");
  return key;
}

/** SHA-256 hash of buffer. */
export function sha256Hash(buffer: Buffer): string {
  return createHash("sha256").update(buffer).digest("hex");
}

/** Persist SessionRecord with s3Key and sha256Hash. */
export async function persistSessionRecord(
  sessionId: string,
  s3Key: string,
  sha256HashValue: string
): Promise<void> {
  await prisma.sessionRecord.upsert({
    where: { sessionId },
    create: { sessionId, s3Key, sha256Hash: sha256HashValue },
    update: { s3Key, sha256Hash: sha256HashValue, generatedAt: new Date() },
  });
}

/** Verify stored record integrity against SHA-256. */
export async function verifySessionRecordIntegrity(sessionId: string): Promise<boolean> {
  const record = await prisma.sessionRecord.findUnique({
    where: { sessionId },
  });
  if (!record) return false;

  const { getFileBuffer } = await import("@/lib/storage");
  const buffer = await getFileBuffer(record.s3Key);
  if (!buffer) return false;

  const computed = sha256Hash(buffer);
  return computed === record.sha256Hash;
}
