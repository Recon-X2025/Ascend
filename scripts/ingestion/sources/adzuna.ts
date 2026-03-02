/**
 * Adzuna India API — 25k free calls/month. Env: ADZUNA_APP_ID, ADZUNA_APP_KEY
 * Usage: npx ts-node scripts/ingestion/sources/adzuna.ts
 */
import { upsertRawJD, buildStats, prisma } from "../lib/upsert-raw-jd";

const APP_ID = process.env.ADZUNA_APP_ID!;
const APP_KEY = process.env.ADZUNA_APP_KEY!;
const COUNTRY = "in";
const BASE_URL = `https://api.adzuna.com/v1/api/jobs/${COUNTRY}/search`;

const SEARCHES = [
  { what: "", where: "bangalore", pages: 10 },
  { what: "", where: "mumbai", pages: 10 },
  { what: "", where: "delhi", pages: 10 },
  { what: "", where: "hyderabad", pages: 8 },
  { what: "", where: "pune", pages: 8 },
  { what: "", where: "chennai", pages: 6 },
  { what: "", where: "kolkata", pages: 5 },
  { what: "", where: "ahmedabad", pages: 4 },
  { what: "", where: "jaipur", pages: 3 },
  { what: "", where: "indore", pages: 3 },
  { what: "product manager", where: "india", pages: 5 },
  { what: "software engineer", where: "india", pages: 5 },
  { what: "data scientist", where: "india", pages: 5 },
  { what: "marketing manager", where: "india", pages: 5 },
  { what: "finance manager", where: "india", pages: 5 },
  { what: "operations manager", where: "india", pages: 5 },
  { what: "human resources", where: "india", pages: 5 },
  { what: "sales manager", where: "india", pages: 5 },
];

const RESULTS_PER_PAGE = 50;
const DELAY_MS = 1000;

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function fetchPage(what: string, where: string, page: number) {
  const params = new URLSearchParams({
    app_id: APP_ID,
    app_key: APP_KEY,
    results_per_page: String(RESULTS_PER_PAGE),
    what,
    where,
    content_type: "application/json",
  });

  const url = `${BASE_URL}/${page}?${params}`;
  const res = await fetch(url);

  if (!res.ok) {
    if (res.status === 429) {
      console.warn("Rate limited — waiting 10 seconds...");
      await sleep(10000);
      return null;
    }
    throw new Error(`Adzuna API error: ${res.status}`);
  }

  return res.json() as Promise<{
    results?: Array<{
      title?: string;
      description?: string;
      redirect_url?: string;
      company?: { display_name?: string };
      location?: { display_name?: string };
      category?: { label?: string };
      salary_min?: number;
      salary_max?: number;
      contract_time?: string;
    }>;
  }>;
}

async function run() {
  if (!APP_ID || !APP_KEY) {
    console.error(
      "Missing ADZUNA_APP_ID or ADZUNA_APP_KEY in environment"
    );
    process.exit(1);
  }

  const stats = buildStats();

  for (const search of SEARCHES) {
    console.log(
      `\nFetching: "${search.what || "all"}" in ${search.where} (${search.pages} pages)`
    );

    for (let page = 1; page <= search.pages; page++) {
      try {
        const data = await fetchPage(search.what, search.where, page);
        if (!data?.results?.length) break;

        for (const job of data.results) {
          if (!job.description || job.description.length < 50) continue;

          const rawText = [
            `Job Title: ${job.title ?? ""}`,
            `Company: ${job.company?.display_name ?? ""}`,
            `Location: ${job.location?.display_name ?? ""}`,
            `Category: ${job.category?.label ?? ""}`,
            job.salary_min ? `Salary Min: ${job.salary_min}` : "",
            job.salary_max ? `Salary Max: ${job.salary_max}` : "",
            job.contract_time ? `Contract Type: ${job.contract_time}` : "",
            `Description:\n${job.description}`,
          ]
            .filter(Boolean)
            .join("\n");

          const sourceUrl =
            job.redirect_url ?? `adzuna://${job.title}-${job.company?.display_name}-${page}`;

          try {
            const result = await upsertRawJD({
              sourceUrl,
              rawText,
              source: "adzuna",
            });
            stats.record(result);
          } catch {
            stats.error();
          }
        }

        process.stdout.write(".");
        await sleep(DELAY_MS);
      } catch (e) {
        console.error(`Error on page ${page}:`, e);
        stats.error();
        await sleep(2000);
      }
    }
  }

  stats.print();
  await prisma.$disconnect();
}

run().catch((e) => {
  console.error(e);
  process.exit(1);
});
