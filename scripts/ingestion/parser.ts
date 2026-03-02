import * as dotenv from "dotenv";
import path from "path";

// Load .env.local then .env so ingest scripts see OPENAI_API_KEY (Next.js only loads these for next dev/build)
dotenv.config({ path: path.resolve(process.cwd(), ".env.local") });
dotenv.config({ path: path.resolve(process.cwd(), ".env") });

import OpenAI from "openai";
import { PrismaClient } from "@prisma/client";
import {
  buildJDParsePrompt,
  JD_PARSE_PROMPT_VERSION,
  JD_PARSE_SYSTEM_PROMPT,
} from "../../lib/ai/prompts/jd-parse";

const prisma = new PrismaClient();
const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

// Normalise city names to standard spelling
const CITY_MAP: Record<string, string> = {
  bengaluru: "Bangalore",
  bangalore: "Bangalore",
  mumbai: "Mumbai",
  bombay: "Mumbai",
  delhi: "Delhi",
  "new delhi": "Delhi",
  ncr: "Delhi",
  hyderabad: "Hyderabad",
  hyd: "Hyderabad",
  pune: "Pune",
  chennai: "Chennai",
  madras: "Chennai",
  kolkata: "Kolkata",
  calcutta: "Kolkata",
  noida: "Noida",
  gurgaon: "Gurgaon",
  gurugram: "Gurgaon",
  ahmedabad: "Ahmedabad",
  indore: "Indore",
  jaipur: "Jaipur",
  kochi: "Kochi",
  cochin: "Kochi",
  surat: "Surat",
  nagpur: "Nagpur",
  chandigarh: "Chandigarh",
  remote: "Remote",
  "work from home": "Remote",
  wfh: "Remote",
};

function normaliseCity(city: string | null): string | null {
  if (!city) return null;
  const key = city.toLowerCase().trim();
  return CITY_MAP[key] || city;
}

async function parseOne(rawJdId: string, model: string): Promise<boolean> {
  const raw = await prisma.rawJD.findUnique({ where: { id: rawJdId } });
  if (!raw) throw new Error(`RawJD not found: ${rawJdId}`);

  try {
    const response = await openai.chat.completions.create({
      model,
      messages: [
        { role: "system", content: JD_PARSE_SYSTEM_PROMPT },
        { role: "user", content: buildJDParsePrompt(raw.rawText) },
      ],
      temperature: 0,
      max_tokens: 1000,
      response_format: { type: "json_object" },
    });

    const content = response.choices[0]?.message?.content;
    if (!content) throw new Error("Empty response from GPT-4o");

    const parsed = JSON.parse(content);

    // Validate required fields
    if (!parsed.title || typeof parsed.title !== "string") {
      throw new Error("Missing or invalid title in parsed response");
    }

    // Normalise location
    parsed.location = normaliseCity(parsed.location);

    // Create ParsedJD
    const parsedJD = await prisma.parsedJD.create({
      data: {
        rawJdId: raw.id,
        title: parsed.title.trim(),
        company: parsed.company?.trim() || null,
        seniority: parsed.seniority || null,
        industry: parsed.industry || null,
        location: parsed.location || null,
        workMode: parsed.workMode || null,
        skills: parsed.skills || { mustHave: [], niceToHave: [] },
        keywords: Array.isArray(parsed.keywords) ? parsed.keywords : [],
        responsibilities: Array.isArray(parsed.responsibilities) ? parsed.responsibilities : [],
        salaryMin: parsed.salaryMin ? parseInt(String(parsed.salaryMin)) : null,
        salaryMax: parsed.salaryMax ? parseInt(String(parsed.salaryMax)) : null,
        currency: parsed.currency || "INR",
        tone: parsed.tone || null,
        companySize: parsed.companySize || null,
        functionalArea: parsed.functionalArea?.trim() || null,
        promptVersion: JD_PARSE_PROMPT_VERSION,
      },
    });

    // Create salary signal if salary data present
    if (parsed.salaryMin && parsed.salaryMax && parsed.title) {
      await prisma.jDSalarySignal.create({
        data: {
          parsedJdId: parsedJD.id,
          role: parsed.title,
          seniority: parsed.seniority || null,
          location: parsed.location || null,
          salaryMin: parseInt(String(parsed.salaryMin)),
          salaryMax: parseInt(String(parsed.salaryMax)),
          currency: parsed.currency || "INR",
        },
      });
    }

    // Mark raw JD as parsed
    await prisma.rawJD.update({
      where: { id: raw.id },
      data: { parsedAt: new Date(), parseError: null },
    });
    return true;
  } catch (err: unknown) {
    // Record error but don't crash — continue processing
    const message = err instanceof Error ? err.message : String(err);
    await prisma.rawJD.update({
      where: { id: raw.id },
      data: { parseError: message },
    });
    console.error(`Parse error for ${rawJdId}: ${message}`);
    return false;
  }
}

async function runParser(options: { limit: number; batch: number; model: string }) {
  // Fetch unparsed RawJDs (no parsedAt, no parseError or retry failed)
  const unparsed = await prisma.rawJD.findMany({
    where: {
      parsedAt: null,
      OR: [
        { parseError: null },
        // Retry failed ones that aren't permanent errors
        { parseError: { not: { contains: "Missing or invalid title" } } },
      ],
    },
    take: options.limit,
    orderBy: { scrapedAt: "asc" },
    select: { id: true },
  });

  console.log(`Found ${unparsed.length} unparsed JDs (limit: ${options.limit})`);

  let processed = 0;
  let succeeded = 0;
  let failed = 0;

  for (let i = 0; i < unparsed.length; i += options.batch) {
    const batchIds = unparsed.slice(i, i + options.batch).map((r) => r.id);
    console.log(`\nBatch ${Math.floor(i / options.batch) + 1}: parsing ${batchIds.length} JDs...`);

    // Process batch sequentially to respect rate limits
    for (const id of batchIds) {
      try {
        const ok = await parseOne(id, options.model);
        if (ok) succeeded++;
        else failed++;
      } catch {
        failed++;
      }
      processed++;

      // Small delay between API calls — avoid rate limit
      await new Promise((r) => setTimeout(r, 200));

      if (processed % 50 === 0) {
        const cost = (processed * 0.01).toFixed(2);
        console.log(`  Progress: ${processed}/${unparsed.length} | ✓ ${succeeded} | ✗ ${failed} | ~$${cost} spent`);
      }
    }

    // Pause between batches
    if (i + options.batch < unparsed.length) {
      console.log("  Batch complete. Pausing 2s...");
      await new Promise((r) => setTimeout(r, 2000));
    }
  }

  console.log(`\n═══ Parser complete ═══`);
  console.log(`Total: ${processed} | Succeeded: ${succeeded} | Failed: ${failed}`);
  console.log(`Estimated cost: ~$${(succeeded * 0.01).toFixed(2)}`);
  await prisma.$disconnect();
}

// CLI args
const args = process.argv.slice(2);
const limitIdx = args.indexOf("--limit");
const limitRaw = limitIdx !== -1 ? args[limitIdx + 1] : undefined;
const batchIdx = args.indexOf("--batch");
const batchRaw = batchIdx !== -1 ? args[batchIdx + 1] : undefined;
const modelIdx = args.indexOf("--model");
const model = modelIdx !== -1 ? args[modelIdx + 1] : "gpt-4o-mini";
const limit = parseInt(limitRaw ?? "10000", 10) || 10000;
const batch = parseInt(batchRaw ?? "25", 10) || 25;

console.log(`Starting parser: limit=${limit}, batch=${batch}, model=${model}`);
runParser({ limit, batch, model }).catch((err) => {
  console.error(err);
  process.exit(1);
});
