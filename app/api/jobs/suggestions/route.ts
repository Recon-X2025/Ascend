import { NextResponse } from "next/server";
import { typesenseClient } from "@/lib/search/client";
import { JOBS_COLLECTION } from "@/lib/search/schemas/jobs";
import { getCachedSuggestions, setCachedSuggestions, suggestionsCacheKey } from "@/lib/search/cache";

const TITLE_LIMIT = 5;
const COMPANY_LIMIT = 3;

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const q = searchParams.get("q")?.trim();
  if (!q || q.length < 2) {
    return NextResponse.json({ titles: [], companies: [] });
  }
  const cacheKey = suggestionsCacheKey(q);
  const cached = await getCachedSuggestions(cacheKey);
  if (cached && typeof cached === "object" && "titles" in cached && "companies" in cached) {
    return NextResponse.json(cached);
  }
  const client = typesenseClient;
  if (!client) {
    return NextResponse.json({ titles: [], companies: [] });
  }
  try {
    const res = await client.collections(JOBS_COLLECTION).documents().search({
      q: `${q}*`,
      query_by: "title,companyName",
      prefix: true,
      filter_by: "status:=ACTIVE",
      per_page: 50,
    });
    const hits = res.hits ?? [];
    const titles: string[] = [];
    const companies: string[] = [];
    const seenT = new Set<string>();
    const seenC = new Set<string>();
    for (const h of hits) {
      const doc = h.document as { title?: string; companyName?: string };
      if (doc.title && !seenT.has(doc.title)) {
        seenT.add(doc.title);
        titles.push(doc.title);
        if (titles.length >= TITLE_LIMIT) break;
      }
    }
    for (const h of hits) {
      const doc = h.document as { companyName?: string };
      if (doc.companyName && !seenC.has(doc.companyName)) {
        seenC.add(doc.companyName);
        companies.push(doc.companyName);
        if (companies.length >= COMPANY_LIMIT) break;
      }
    }
    const result = { titles, companies };
    await setCachedSuggestions(cacheKey, result);
    return NextResponse.json(result);
  } catch {
    return NextResponse.json({ titles: [], companies: [] });
  }
}
