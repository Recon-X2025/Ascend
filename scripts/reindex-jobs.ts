/**
 * One-time or on-demand reindex of all ACTIVE jobs into Typesense.
 * Run: npx ts-node scripts/reindex-jobs.ts (or npm run reindex:jobs)
 */

import { ensureJobsCollection } from "../lib/search/schemas/jobs";
import { reindexAllJobs } from "../lib/search/sync/jobs";

async function main() {
  console.log("Ensuring jobs collection exists...");
  await ensureJobsCollection();
  console.log("Reindexing all ACTIVE jobs...");
  const { indexed, errors } = await reindexAllJobs();
  console.log(`Done. Indexed: ${indexed}, errors: ${errors}`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
