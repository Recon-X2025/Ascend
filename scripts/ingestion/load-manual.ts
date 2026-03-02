// Usage: pipe a JD text file into this script
// echo "JD text here" | npx ts-node scripts/ingestion/load-manual.ts --title "Senior PM" --source manual
// OR: npx ts-node scripts/ingestion/load-manual.ts --file ./jds/pm-google.txt --source manual

import { createHash } from "crypto";
import * as fs from "fs";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function loadManual(rawText: string, source: string, url?: string) {
  if (rawText.length < 100) {
    console.error("JD text too short (< 100 chars). Aborting.");
    process.exit(1);
  }

  const hash = createHash("sha256").update(rawText).digest("hex");

  const exists = await prisma.rawJD.findUnique({ where: { hash } });
  if (exists) {
    console.log("Duplicate JD — already in database. Skipping.");
    await prisma.$disconnect();
    return;
  }

  const record = await prisma.rawJD.create({
    data: {
      sourceUrl: url || `manual:${hash.slice(0, 8)}`,
      rawText,
      hash,
      source,
    },
  });

  console.log(`Saved RawJD: ${record.id}`);
  await prisma.$disconnect();
}

const args = process.argv.slice(2);
const fileArg = args[args.indexOf("--file") + 1];
const sourceArg = args[args.indexOf("--source") + 1] || "manual";
const urlArg = args[args.indexOf("--url") + 1];

let rawText = "";

if (fileArg) {
  rawText = fs.readFileSync(fileArg, "utf-8").trim();
} else {
  // Read from stdin
  rawText = fs.readFileSync("/dev/stdin", "utf-8").trim();
}

loadManual(rawText, sourceArg, urlArg).catch(console.error);
