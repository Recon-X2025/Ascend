/**
 * Naukri RSS feeds — category and location feeds. Optional dep: npm install rss-parser
 * Usage: npx ts-node scripts/ingestion/sources/naukri-rss.ts
 */
import RSSParser from "rss-parser";
import { upsertRawJD, buildStats, prisma } from "../lib/upsert-raw-jd";

const parser = new RSSParser();
const DELAY_MS = 2000;

const FEEDS = [
  "https://www.naukri.com/rss/jobs-in-bangalore.rss",
  "https://www.naukri.com/rss/jobs-in-mumbai.rss",
  "https://www.naukri.com/rss/jobs-in-delhi-ncr.rss",
  "https://www.naukri.com/rss/jobs-in-hyderabad.rss",
  "https://www.naukri.com/rss/jobs-in-pune.rss",
  "https://www.naukri.com/rss/jobs-in-chennai.rss",
  "https://www.naukri.com/rss/jobs-in-kolkata.rss",
  "https://www.naukri.com/rss/jobs-in-ahmedabad.rss",
  "https://www.naukri.com/rss/jobs-in-jaipur.rss",
  "https://www.naukri.com/rss/jobs-in-indore.rss",
  "https://www.naukri.com/rss/jobs-in-coimbatore.rss",
  "https://www.naukri.com/rss/jobs-in-nagpur.rss",
  "https://www.naukri.com/rss/jobs-in-kochi.rss",
  "https://www.naukri.com/rss/it-software-jobs.rss",
  "https://www.naukri.com/rss/marketing-advertising-jobs.rss",
  "https://www.naukri.com/rss/finance-accounting-jobs.rss",
  "https://www.naukri.com/rss/sales-business-development-jobs.rss",
  "https://www.naukri.com/rss/human-resource-jobs.rss",
  "https://www.naukri.com/rss/operations-management-jobs.rss",
  "https://www.naukri.com/rss/product-management-jobs.rss",
  "https://www.naukri.com/rss/data-analytics-jobs.rss",
  "https://www.naukri.com/rss/engineering-jobs.rss",
  "https://www.naukri.com/rss/bfsi-jobs.rss",
];

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function run() {
  const stats = buildStats();

  for (const feedUrl of FEEDS) {
    console.log("\nParsing:", feedUrl);

    try {
      const feed = await parser.parseURL(feedUrl);

      for (const item of feed.items ?? []) {
        if (!item.link || !item.contentSnippet) continue;

        const rawText = [
          item.title ? `Job Title: ${item.title}` : "",
          item.creator ? `Company: ${item.creator}` : "",
          "Source: Naukri",
          `Description:\n${item.contentSnippet ?? item.content ?? ""}`,
        ]
          .filter(Boolean)
          .join("\n");

        if (rawText.length < 100) continue;

        try {
          const result = await upsertRawJD({
            sourceUrl: item.link,
            rawText,
            source: "naukri-rss",
          });
          stats.record(result);
        } catch {
          stats.error();
        }
      }

      process.stdout.write(`  ${feed.items?.length ?? 0} items\n`);
      await sleep(DELAY_MS);
    } catch (e) {
      console.error("Failed to parse feed", feedUrl, e);
      stats.error();
      await sleep(3000);
    }
  }

  stats.print();
  await prisma.$disconnect();
}

run().catch((e) => {
  console.error(e);
  process.exit(1);
});
