/**
 * RemoteOK public API — no key. India + remote roles.
 * Usage: npx ts-node scripts/ingestion/sources/remoteok.ts
 */
import { upsertRawJD, buildStats, prisma } from "../lib/upsert-raw-jd";

const REMOTEOK_API = "https://remoteok.com/api";
const DELAY_MS = 50;

interface RemoteOKJob {
  id?: string;
  position?: string;
  company?: string;
  location?: string;
  description?: string;
  url?: string;
  tags?: string[];
  salary?: string;
}

async function run() {
  console.log("Fetching RemoteOK jobs...");

  const res = await fetch(REMOTEOK_API, {
    headers: {
      "User-Agent":
        "Ascend Job Platform / job data ingestion (contact: admin@ascend.jobs)",
    },
  });

  if (!res.ok) throw new Error(`RemoteOK API error: ${res.status}`);

  const jobs = (await res.json()) as RemoteOKJob[];
  const jobList = jobs.filter((j) => j.id && j.description);

  console.log("Fetched", jobList.length, "jobs");

  const stats = buildStats();

  for (const job of jobList) {
    const tags = (job.tags ?? []).join(" ").toLowerCase();
    const loc = (job.location ?? "").toLowerCase();
    const isRelevant =
      loc.includes("india") ||
      loc.includes("worldwide") ||
      loc === "" ||
      tags.includes("remote");

    if (!isRelevant) continue;

    const rawText = [
      `Job Title: ${job.position ?? ""}`,
      `Company: ${job.company ?? ""}`,
      `Location: ${job.location || "Remote"}`,
      job.salary ? `Salary: ${job.salary}` : "",
      `Tags: ${(job.tags ?? []).join(", ")}`,
      `Description:\n${job.description ?? ""}`,
    ]
      .filter(Boolean)
      .join("\n");

    if (rawText.length < 100) continue;

    const sourceUrl =
      job.url ?? `https://remoteok.com/remote-jobs/${job.id}`;

    try {
      const result = await upsertRawJD({
        sourceUrl,
        rawText,
        source: "remoteok",
      });
      stats.record(result);
    } catch {
      stats.error();
    }

    await new Promise((r) => setTimeout(r, DELAY_MS));
  }

  stats.print();
  await prisma.$disconnect();
}

run().catch((e) => {
  console.error(e);
  process.exit(1);
});
