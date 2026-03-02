import { createHash } from "crypto";
import * as fs from "fs";
import { parse } from "csv-parse";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

// Supported CSV column mappings for different Kaggle datasets
const COLUMN_MAPS: Record<
  string,
  {
    title?: string;
    description: string;
    location?: string;
    company?: string;
    salary?: string;
    url?: string;
  }
> = {
  "kaggle-naukri": {
    title: "Job Title",
    description: "Job Description",
    location: "Location",
    company: "Company",
    salary: "Salary",
    url: "Job Link",
  },
  "kaggle-linkedin": {
    title: "title",
    description: "description",
    location: "location",
    company: "company_name",
    salary: "salary",
    url: "job_posting_url",
  },
};

async function loadCSV(filePath: string, source: string) {
  const colMap = COLUMN_MAPS[source];
  if (!colMap) {
    throw new Error(`Unknown source: ${source}. Add column mapping to COLUMN_MAPS.`);
  }

  const content = fs.readFileSync(filePath, "utf-8");
  let inserted = 0;
  let skipped = 0;
  let errors = 0;

  await new Promise<void>((resolve, reject) => {
    parse(
      content,
      {
        columns: true,
        skip_empty_lines: true,
        trim: true,
      },
      async (err, records: Record<string, string>[]) => {
        if (err) return reject(err);

        console.log(`Processing ${records.length} records from ${source}...`);

        for (const record of records) {
          try {
            const rawText = record[colMap.description]?.trim();
            if (!rawText || rawText.length < 100) {
              skipped++;
              continue;
            }

            // Build a richer raw text combining available fields
            const title = colMap.title ? record[colMap.title]?.trim() : "";
            const location = colMap.location ? record[colMap.location]?.trim() : "";
            const company = colMap.company ? record[colMap.company]?.trim() : "";
            const salary = colMap.salary ? record[colMap.salary]?.trim() : "";

            const fullText = [
              title ? `Job Title: ${title}` : "",
              company ? `Company: ${company}` : "",
              location ? `Location: ${location}` : "",
              salary ? `Salary: ${salary}` : "",
              `Job Description:\n${rawText}`,
            ]
              .filter(Boolean)
              .join("\n");

            const hash = createHash("sha256").update(fullText).digest("hex");

            // Dedup check
            const exists = await prisma.rawJD.findUnique({ where: { hash } });
            if (exists) {
              skipped++;
              continue;
            }

            const sourceUrl = colMap.url
              ? (record[colMap.url]?.trim() || `${source}:${hash.slice(0, 8)}`)
              : `${source}:${hash.slice(0, 8)}`;

            await prisma.rawJD.create({
              data: {
                sourceUrl,
                rawText: fullText,
                hash,
                source,
              },
            });
            inserted++;

            if (inserted % 500 === 0) {
              console.log(`  Progress: ${inserted} inserted, ${skipped} skipped`);
            }
          } catch (e: unknown) {
            errors++;
            if (errors < 5) console.error("Row error:", (e as Error).message);
          }
        }

        console.log(`\nDone. Inserted: ${inserted} | Skipped (dup/short): ${skipped} | Errors: ${errors}`);
        resolve();
      }
    );
  });

  await prisma.$disconnect();
}

// CLI: npx ts-node scripts/ingestion/load-csv.ts --file ./data/naukri.csv --source kaggle-naukri
const args = process.argv.slice(2);
const fileArg = args[args.indexOf("--file") + 1];
const sourceArg = args[args.indexOf("--source") + 1];

if (!fileArg || !sourceArg) {
  console.error("Usage: npx ts-node scripts/ingestion/load-csv.ts --file <path> --source <source-name>");
  console.error("Sources:", Object.keys(COLUMN_MAPS).join(", "));
  process.exit(1);
}

loadCSV(fileArg, sourceArg).catch(console.error);
