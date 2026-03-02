import crypto from "crypto";
import { prisma } from "../../../lib/prisma/client";

export async function upsertRawJD({
  sourceUrl,
  rawText,
  source,
}: {
  sourceUrl: string;
  rawText: string;
  source: string;
}): Promise<{ inserted: boolean; id: string }> {
  const hash = crypto.createHash("sha256").update(rawText).digest("hex");

  const existing = await prisma.rawJD.findUnique({ where: { hash } });
  if (existing) return { inserted: false, id: existing.id };

  const record = await prisma.rawJD.create({
    data: {
      sourceUrl,
      rawText,
      hash,
      source,
      scrapedAt: new Date(),
    },
  });

  return { inserted: true, id: record.id };
}

export function buildStats() {
  let inserted = 0;
  let skipped = 0;
  let errors = 0;

  return {
    record(result: { inserted: boolean }) {
      if (result.inserted) inserted++;
      else skipped++;
    },
    error() {
      errors++;
    },
    print() {
      console.log(
        `\nDone. Inserted: ${inserted} | Skipped (duplicate): ${skipped} | Errors: ${errors}`
      );
    },
  };
}

export { prisma };
