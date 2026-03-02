import Firecrawl from '@mendable/firecrawl-js';

const globalForFirecrawl = globalThis as unknown as {
  firecrawl: Firecrawl | undefined;
};

function getFirecrawlClient(): Firecrawl {
  if (!process.env.FIRECRAWL_API_KEY) {
    throw new Error('FIRECRAWL_API_KEY is not set');
  }
  return globalForFirecrawl.firecrawl ?? new Firecrawl({
    apiKey: process.env.FIRECRAWL_API_KEY,
  });
}

if (process.env.NODE_ENV !== 'production') {
  if (process.env.FIRECRAWL_API_KEY) {
    globalForFirecrawl.firecrawl = getFirecrawlClient();
  }
}

export async function scrapeJobDescription(url: string): Promise<string> {
  const client = getFirecrawlClient();

  try {
    const result = await client.scrape(url, {
      formats: ['markdown'],
    });

    return result.markdown ?? '';
  } catch (err) {
    throw new Error(
      `Failed to scrape job description from ${url}: ${
        err instanceof Error ? err.message : String(err)
      }`
    );
  }
}
