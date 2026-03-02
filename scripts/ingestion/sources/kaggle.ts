/**
 * Kaggle dataset importer — Naukri / LinkedIn / Indeed column formats.
 * Usage: npx ts-node scripts/ingestion/sources/kaggle.ts --file ./data/naukri-jobs.csv --format naukri
 * Usage: npx ts-node scripts/ingestion/sources/kaggle.ts --file ./data/linkedin-jobs.csv --format linkedin
 */
import crypto from "crypto";
import { parse } from "csv-parse/sync";
import fs from "fs";
import path from "path";
import { upsertRawJD, buildStats, prisma } from "../lib/upsert-raw-jd";

const FORMATS: Record<
  string,
  {
    title: string;
    company: string;
    location: string;
    description: string;
    skills?: string;
    experience?: string;
    salary?: string;
    type?: string;
  }
> = {
  naukri: {
    // Exact column names from marketing_sample_for_naukri_com CSV
    // Columns: Uniq Id, Crawl Timestamp, Job Title, Job Salary, Job Experience Required,
    //          Key Skills, Role Category, Location, Functional Area, Industry, Role
    // NOTE: No Company or Description column in this dataset
    title: "Job Title",
    company: "", // not present in this dataset
    location: "Location",
    description: "Role", // closest field to a description
    skills: "Key Skills",
    experience: "Job Experience Required",
    salary: "Job Salary",
  },
  linkedin: {
    title: "title",
    company: "company_name",
    location: "location",
    description: "description",
    type: "formatted_work_type",
  },
  indeed: {
    title: "Job Title",
    company: "Company",
    location: "Location",
    description: "Job Description",
    salary: "Salary",
  },
  generic: {
    title: "title",
    company: "company",
    location: "location",
    description: "description",
  },
};

async function run() {
  const args = process.argv.slice(2);
  const fileIdx = args.indexOf("--file");
  const fmtIdx = args.indexOf("--format");

  if (fileIdx === -1) {
    console.error(
      "Usage: --file <path> [--format naukri|linkedin|indeed|generic]"
    );
    process.exit(1);
  }

  const filePath = args[fileIdx + 1];
  const format = fmtIdx !== -1 ? args[fmtIdx + 1] : "generic";
  const cols = FORMATS[format] ?? FORMATS.generic;

  const raw = fs.readFileSync(path.resolve(filePath), "utf-8");
  const records = parse(raw, {
    columns: true,
    skip_empty_lines: true,
    relax_quotes: true,
  });

  console.log(
    `Loaded ${records.length} rows from ${filePath} (format: ${format})`
  );

  const stats = buildStats();

  for (const row of records as Record<string, string>[]) {
    const title =
      cols.title ? (row[cols.title] ?? "").trim() : "";
    const company =
      cols.company ? (row[cols.company] ?? "").trim() : "";
    const location =
      cols.location ? (row[cols.location] ?? "").trim() : "";
    const description =
      cols.description ? (row[cols.description] ?? "").trim() : "";
    const skills =
      cols.skills ? (row[cols.skills] ?? "").trim() : "";
    const experience =
      cols.experience ? (row[cols.experience] ?? "").trim() : "";
    const salary =
      cols.salary ? (row[cols.salary] ?? "").trim() : "";

    // Naukri-specific extra columns (silently ignored for other formats)
    const roleCategory =
      row["Role Category"] ? String(row["Role Category"]).trim() : "";
    const functionalArea =
      row["Functional Area"] ? String(row["Functional Area"]).trim() : "";
    const industry =
      row["Industry"] ? String(row["Industry"]).trim() : "";

    // Naukri has no long description — validate on skills or roleCategory instead
    const hasContent =
      description.length >= 50 ||
      skills.length > 10 ||
      roleCategory.length > 0;
    if (!title || !hasContent) {
      stats.error();
      continue;
    }

    // Strip "Not Disclosed by Recruiter" — don't pollute salary signals
    const salaryClean =
      salary && !salary.toLowerCase().includes("not disclosed")
        ? salary
        : "";

    const rawText = [
      `Job Title: ${title}`,
      company ? `Company: ${company}` : "",
      location ? `Location: ${location}` : "",
      experience ? `Experience Required: ${experience}` : "",
      salaryClean ? `Salary: ${salaryClean}` : "",
      skills ? `Key Skills: ${skills}` : "",
      roleCategory ? `Role Category: ${roleCategory}` : "",
      functionalArea ? `Functional Area: ${functionalArea}` : "",
      industry ? `Industry: ${industry}` : "",
      description ? `Role: ${description}` : "",
    ]
      .filter(Boolean)
      .join("\n");

    // Naukri rows have no source URL — build a stable dedup key from content
    const dedupeKey = `${title}-${location}-${skills}`.slice(0, 80);
    const sourceUrl =
      format === "naukri"
        ? `kaggle://${format}/${Buffer.from(dedupeKey).toString("base64").slice(0, 40)}`
        : `kaggle://${format}/${crypto.createHash("sha256").update(rawText).digest("hex").slice(0, 24)}`;

    try {
      const result = await upsertRawJD({ sourceUrl, rawText, source: "kaggle" });
      stats.record(result);
    } catch {
      stats.error();
    }
  }

  stats.print();
  await prisma.$disconnect();
}

run().catch((e) => {
  console.error(e);
  process.exit(1);
});
