/**
 * One-time or on-demand reindex of ParsedJD table into Typesense.
 * Run: npm run reindex:jobs
 *
 * Requires .env with: DATABASE_URL, TYPESENSE_HOST, TYPESENSE_PORT,
 * TYPESENSE_PROTOCOL, TYPESENSE_API_KEY
 */

import "dotenv/config";
import { prisma } from "@/lib/prisma/client";
import { getTypesenseConnectionString } from "../lib/search/client";
import { ensureJobsCollection } from "../lib/search/schemas/jobs";
import { reindexAllJobs } from "../lib/search/sync/jobs";

async function main() {
  console.log("Ensuring jobs collection exists...");
  await ensureJobsCollection();
  console.log(`Connected to Typesense at ${getTypesenseConnectionString()}`);
  const jobPostCount = await prisma.jobPost.count({ where: { visibility: "PUBLIC" } });
  const parsedJDCount = await prisma.parsedJD.count();
  const total = jobPostCount + parsedJDCount;
  console.log(`Found ${jobPostCount} JobPost + ${parsedJDCount} ParsedJD = ${total} jobs`);
  console.log("Indexing jobs...");
  const { indexed, errors } = await reindexAllJobs();
  console.log(`Indexed ${indexed} jobs`);
  if (errors > 0) {
    console.log(`Errors: ${errors}`);
  }
  console.log("Done");
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
