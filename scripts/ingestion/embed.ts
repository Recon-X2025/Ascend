import * as dotenv from "dotenv";
import path from "path";

dotenv.config({ path: path.resolve(process.cwd(), ".env.local") });
dotenv.config({ path: path.resolve(process.cwd(), ".env") });

import OpenAI from "openai";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();
const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

const EMBEDDING_MODEL = "text-embedding-3-small";

// Build a rich text representation of a ParsedJD for embedding
function buildEmbeddingText(parsed: {
  title: string;
  seniority: string | null;
  industry: string | null;
  location: string | null;
  workMode: string | null;
  skills: { mustHave: string[]; niceToHave: string[] };
  keywords: string[];
  responsibilities: string[];
}): string {
  return [
    `Job Title: ${parsed.title}`,
    parsed.seniority ? `Level: ${parsed.seniority}` : "",
    parsed.industry ? `Industry: ${parsed.industry}` : "",
    parsed.location ? `Location: ${parsed.location}` : "",
    parsed.workMode ? `Work Mode: ${parsed.workMode}` : "",
    parsed.skills.mustHave.length ? `Required Skills: ${parsed.skills.mustHave.join(", ")}` : "",
    parsed.skills.niceToHave.length ? `Nice to Have: ${parsed.skills.niceToHave.join(", ")}` : "",
    parsed.keywords.length ? `Keywords: ${parsed.keywords.join(", ")}` : "",
    parsed.responsibilities.length
      ? `Responsibilities: ${parsed.responsibilities.join(". ")}`
      : "",
  ]
    .filter(Boolean)
    .join("\n");
}

async function embedOne(parsedJdId: string): Promise<void> {
  const parsed = await prisma.parsedJD.findUnique({
    where: { id: parsedJdId },
  });
  if (!parsed) throw new Error(`ParsedJD not found: ${parsedJdId}`);

  const skills = parsed.skills as { mustHave: string[]; niceToHave: string[] };
  const text = buildEmbeddingText({
    ...parsed,
    skills,
  });

  const response = await openai.embeddings.create({
    model: EMBEDDING_MODEL,
    input: text,
  });

  const embedding = response.data[0].embedding;

  await prisma.jDEmbedding.create({
    data: {
      parsedJdId: parsed.id,
      embedding: embedding as unknown as object,
      model: EMBEDDING_MODEL,
    },
  });
}

async function runEmbedder(options: { limit: number }) {
  // Find ParsedJDs without embeddings
  const unembedded = await prisma.parsedJD.findMany({
    where: { embedding: null },
    take: options.limit,
    orderBy: { parsedAt: "asc" },
    select: { id: true, title: true },
  });

  console.log(`Found ${unembedded.length} un-embedded ParsedJDs (limit: ${options.limit})`);

  let processed = 0;
  let succeeded = 0;
  let failed = 0;

  for (const { id, title } of unembedded) {
    try {
      await embedOne(id);
      succeeded++;
    } catch (err: unknown) {
      failed++;
      if (failed < 5) console.error(`Embed error (${title}):`, (err as Error).message);
    }
    processed++;

    await new Promise((r) => setTimeout(r, 50)); // text-embedding is fast, small delay

    if (processed % 100 === 0) {
      const cost = (processed * 0.00002).toFixed(4);
      console.log(`  Progress: ${processed}/${unembedded.length} | ✓ ${succeeded} | ✗ ${failed} | ~$${cost}`);
    }
  }

  console.log(`\n═══ Embedder complete ═══`);
  console.log(`Total: ${processed} | Succeeded: ${succeeded} | Failed: ${failed}`);
  console.log(`Estimated cost: ~$${(succeeded * 0.00002).toFixed(4)}`);
  await prisma.$disconnect();
}

const args = process.argv.slice(2);
const limit = parseInt(args[args.indexOf("--limit") + 1] || "10000");

console.log(`Starting embedder: limit=${limit}`);
runEmbedder({ limit }).catch((err) => {
  console.error(err);
  process.exit(1);
});
