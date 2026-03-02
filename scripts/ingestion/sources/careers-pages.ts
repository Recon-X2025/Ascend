/**
 * Company careers page scraper (Playwright). Curated Indian companies.
 * Usage: npx ts-node scripts/ingestion/sources/careers-pages.ts
 * Dep: npm install playwright && npx playwright install chromium
 */
import { chromium } from "playwright";
import { upsertRawJD, buildStats, prisma } from "../lib/upsert-raw-jd";

const COMPANIES = [
  {
    company: "Razorpay",
    careersUrl: "https://razorpay.com/jobs/",
    jobLinkSelector: 'a[href*="/jobs/"]',
  },
  {
    company: "PhonePe",
    careersUrl: "https://www.phonepe.com/en/careers.html",
    jobLinkSelector: 'a[href*="careers"]',
  },
  {
    company: "Paytm",
    careersUrl: "https://paytm.com/careers",
    jobLinkSelector: 'a[href*="career"]',
  },
  {
    company: "CRED",
    careersUrl: "https://careers.cred.club/",
    jobLinkSelector: 'a[href*="/jobs/"]',
  },
  {
    company: "Zepto",
    careersUrl: "https://www.zepto.com/careers",
    jobLinkSelector: 'a[href*="job"]',
  },
  {
    company: "Meesho",
    careersUrl: "https://careers.meesho.com/",
    jobLinkSelector: 'a[href*="job"]',
  },
  {
    company: "Swiggy",
    careersUrl: "https://careers.swiggy.com/",
    jobLinkSelector: 'a[href*="job"]',
  },
  {
    company: "Zomato",
    careersUrl: "https://www.zomato.com/careers",
    jobLinkSelector: 'a[href*="job"]',
  },
  {
    company: "Flipkart",
    careersUrl: "https://www.flipkartcareers.com/",
    jobLinkSelector: 'a[href*="job"]',
  },
  {
    company: "Ola",
    careersUrl: "https://ola.careers/",
    jobLinkSelector: 'a[href*="job"]',
  },
  {
    company: "Byju's",
    careersUrl: "https://careers.byjus.com/",
    jobLinkSelector: 'a[href*="job"]',
  },
  {
    company: "Unacademy",
    careersUrl: "https://unacademy.com/careers",
    jobLinkSelector: 'a[href*="job"]',
  },
  {
    company: "Infosys",
    careersUrl: "https://www.infosys.com/careers/",
    jobLinkSelector: 'a[href*="job"]',
  },
  {
    company: "TCS",
    careersUrl: "https://www.tcs.com/careers",
    jobLinkSelector: 'a[href*="job"]',
  },
  {
    company: "Wipro",
    careersUrl: "https://careers.wipro.com/",
    jobLinkSelector: 'a[href*="job"]',
  },
  {
    company: "Freshworks",
    careersUrl: "https://www.freshworks.com/company/careers/",
    jobLinkSelector: 'a[href*="job"]',
  },
  {
    company: "Zoho",
    careersUrl: "https://www.zoho.com/careers.html",
    jobLinkSelector: 'a[href*="career"]',
  },
  {
    company: "Chargebee",
    careersUrl: "https://www.chargebee.com/careers/",
    jobLinkSelector: 'a[href*="job"]',
  },
];

const DELAY_MS = 3000;

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function scrapeCompany(
  browser: Awaited<ReturnType<typeof chromium.launch>>,
  company: (typeof COMPANIES)[0],
  stats: ReturnType<typeof buildStats>
) {
  const page = await browser.newPage();

  try {
    console.log(`\n${company.company}: ${company.careersUrl}`);
    await page.goto(company.careersUrl, {
      waitUntil: "networkidle",
      timeout: 30000,
    });
    await sleep(2000);

    const jobLinks: string[] = await page.evaluate((selector: string) => {
      const anchors = Array.from(document.querySelectorAll<HTMLAnchorElement>(selector));
      return anchors
        .map((a) => a.href)
        .filter((href: string) => href && href.startsWith("http"))
        .slice(0, 30);
    }, company.jobLinkSelector);

    console.log(`  Found ${jobLinks.length} job links`);

    for (const jobUrl of jobLinks) {
      try {
        await page.goto(jobUrl, {
          waitUntil: "networkidle",
          timeout: 20000,
        });
        await sleep(1000);

        const rawText = await page.evaluate(() => {
          const remove = document.querySelectorAll(
            "nav, footer, script, style, header"
          );
          remove.forEach((el) => el.remove());
          return document.body.innerText;
        });

        if (!rawText || rawText.length < 200) continue;

        const result = await upsertRawJD({
          sourceUrl: jobUrl,
          rawText: `Company: ${company.company}\n\n${rawText}`,
          source: "careers-page",
        });

        stats.record(result);
        await sleep(DELAY_MS);
      } catch (e) {
        console.error(
          `  Error fetching ${jobUrl}:`,
          (e as Error).message
        );
        stats.error();
      }
    }
  } catch (e) {
    console.error(
      `Failed to load ${company.careersUrl}:`,
      (e as Error).message
    );
    stats.error();
  } finally {
    await page.close();
  }
}

async function run() {
  const browser = await chromium.launch({ headless: true });
  const stats = buildStats();

  for (const company of COMPANIES) {
    await scrapeCompany(browser, company, stats);
  }

  await browser.close();
  stats.print();
  await prisma.$disconnect();
}

run().catch((e) => {
  console.error(e);
  process.exit(1);
});
