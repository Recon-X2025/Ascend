/**
 * Phase 14 — SEO: Audit job post slugs for Google for Jobs compatibility.
 * Expected pattern: /jobs/[title-slug]-at-[company-slug]-[id] or similar.
 * Run: npx ts-node --project tsconfig.json scripts/seo/audit-slugs.ts
 */

import { prisma } from "../../lib/prisma/client";

async function main() {
  const jobs = await prisma.jobPost.findMany({
    select: {
      id: true,
      title: true,
      slug: true,
      companyRef: { select: { slug: true } },
    },
  });

  const malformed = jobs.filter((j) => !j.slug.includes("-at-"));
  console.log(`Total jobs: ${jobs.length}`);
  console.log(`Jobs with non-standard slugs (missing "-at-"): ${malformed.length}`);
  if (malformed.length > 0) {
    malformed.slice(0, 20).forEach((j) => {
      console.log(`  id=${j.id} slug=${j.slug} company=${j.companyRef?.slug ?? "n/a"}`);
    });
    if (malformed.length > 20) console.log(`  ... and ${malformed.length - 20} more`);
  }
}

main()
  .then(() => process.exit(0))
  .catch((e) => {
    console.error(e);
    process.exit(1);
  });
