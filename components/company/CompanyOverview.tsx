import { sanitizeRichText } from "@/lib/html/sanitize";
import { RatingSummaryCard } from "./RatingSummaryCard";
import { BenefitChip } from "./BenefitChip";
import { MediaGallery } from "./MediaGallery";
import type { CompanyForPage } from "@/lib/companies/queries";

interface CompanyOverviewProps {
  company: CompanyForPage;
}

function formatLink(href: string, label: string) {
  return (
    <a href={href} target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">
      {label}
    </a>
  );
}

export function CompanyOverview({ company }: CompanyOverviewProps) {
  const {
    mission,
    about,
    founded,
    hq,
    website,
    linkedin,
    industry,
    type,
    size,
    specialties,
    benefits,
    media,
    ratingAggregate,
  } = company;

  const agg = ratingAggregate;
  const trendingBadges: string[] = [];
  if (agg) {
    if (agg.cultureAvg > 4.0) trendingBadges.push("Great Culture");
    if (agg.salaryAvg > 4.0) trendingBadges.push("Top Payer");
    if (agg.workLifeAvg > 4.2) trendingBadges.push("Work-Life Balance");
  }

  const SIZE_LABELS: Record<string, string> = {
    SIZE_1_10: "1-10",
    SIZE_11_50: "11-50",
    SIZE_51_200: "51-200",
    SIZE_201_500: "201-500",
    SIZE_501_1000: "501-1000",
    SIZE_1001_PLUS: "1001+",
  };

  return (
    <div className="mt-6 space-y-8">
      {(about || mission) && (
        <section>
          <h2 className="text-lg font-semibold mb-2">About</h2>
          {mission && <p className="text-muted-foreground mb-4">{mission}</p>}
          {about && (
            <div
              className="prose prose-sm max-w-none"
              dangerouslySetInnerHTML={{ __html: sanitizeRichText(about) }}
            />
          )}
        </section>
      )}

      <section>
        <h2 className="text-lg font-semibold mb-2">Quick facts</h2>
        <dl className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-sm">
          {founded != null && (
            <>
              <dt className="text-muted-foreground">Founded</dt>
              <dd>{founded}</dd>
            </>
          )}
          {hq && (
            <>
              <dt className="text-muted-foreground">HQ</dt>
              <dd>{hq}</dd>
            </>
          )}
          {size && (
            <>
              <dt className="text-muted-foreground">Size</dt>
              <dd>{SIZE_LABELS[size] ?? size}</dd>
            </>
          )}
          {type && (
            <>
              <dt className="text-muted-foreground">Type</dt>
              <dd>{type.replace(/_/g, " ")}</dd>
            </>
          )}
          {website && (
            <>
              <dt className="text-muted-foreground">Website</dt>
              <dd>{formatLink(website, "Website")}</dd>
            </>
          )}
          {linkedin && (
            <>
              <dt className="text-muted-foreground">LinkedIn</dt>
              <dd>{formatLink(linkedin, "LinkedIn")}</dd>
            </>
          )}
          {industry && (
            <>
              <dt className="text-muted-foreground">Industry</dt>
              <dd>{industry}</dd>
            </>
          )}
        </dl>
      </section>

      {specialties.length > 0 && (
        <section>
          <h2 className="text-lg font-semibold mb-2">Specialties</h2>
          <div className="flex flex-wrap gap-2">
            {specialties.map((s) => (
              <span key={s} className="rounded-md border border-border px-2 py-1 text-sm">
                {s}
              </span>
            ))}
          </div>
        </section>
      )}

      <section>
        <RatingSummaryCard aggregate={ratingAggregate} />
        {trendingBadges.length > 0 && (
          <div className="flex flex-wrap gap-2 mt-2">
            {trendingBadges.map((b) => (
              <span key={b} className="rounded-md bg-primary/10 px-2 py-1 text-xs font-medium text-primary">
                {b}
              </span>
            ))}
          </div>
        )}
      </section>

      {benefits.length > 0 && (
        <section>
          <h2 className="text-lg font-semibold mb-2">Benefits</h2>
          <div className="flex flex-wrap gap-2">
            {benefits.map((b) => (
              <BenefitChip key={b.id} label={b.label} icon={b.icon} avgRating={b.avgRating} />
            ))}
          </div>
        </section>
      )}

      <MediaGallery media={media} />
    </div>
  );
}
