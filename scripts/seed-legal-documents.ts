/**
 * M-15: Seed active LegalDocument records for Mentorship Marketplace Addendum and Mentor Conduct Agreement.
 * Idempotent — does not create duplicates. Run: npx ts-node --compiler-options '{"module":"CommonJS"}' scripts/seed-legal-documents.ts
 */
import { PrismaClient } from "@prisma/client";
import {
  MENTORSHIP_MARKETPLACE_ADDENDUM_V1,
  MENTOR_CONDUCT_AGREEMENT_V1,
} from "../lib/mentorship/legal/documents";

const prisma = new PrismaClient();

async function main() {
  const now = new Date();

  const existingAddendum = await prisma.legalDocument.findFirst({
    where: { type: "MENTORSHIP_MARKETPLACE_ADDENDUM", isActive: true },
  });
  if (!existingAddendum) {
    await prisma.legalDocument.create({
      data: {
        type: MENTORSHIP_MARKETPLACE_ADDENDUM_V1.type,
        version: MENTORSHIP_MARKETPLACE_ADDENDUM_V1.version,
        title: MENTORSHIP_MARKETPLACE_ADDENDUM_V1.title,
        content: MENTORSHIP_MARKETPLACE_ADDENDUM_V1.content,
        effectiveAt: now,
        isActive: true,
      },
    });
    console.log("Created Mentorship Marketplace Addendum v1.0.0");
  } else {
    console.log("Mentorship Marketplace Addendum already exists (active)");
  }

  const existingConduct = await prisma.legalDocument.findFirst({
    where: { type: "MENTOR_CONDUCT_AGREEMENT", isActive: true },
  });
  if (!existingConduct) {
    await prisma.legalDocument.create({
      data: {
        type: MENTOR_CONDUCT_AGREEMENT_V1.type,
        version: MENTOR_CONDUCT_AGREEMENT_V1.version,
        title: MENTOR_CONDUCT_AGREEMENT_V1.title,
        content: MENTOR_CONDUCT_AGREEMENT_V1.content,
        effectiveAt: now,
        isActive: true,
      },
    });
    console.log("Created Mentor Conduct Agreement v1.0.0");
  } else {
    console.log("Mentor Conduct Agreement already exists (active)");
  }
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
