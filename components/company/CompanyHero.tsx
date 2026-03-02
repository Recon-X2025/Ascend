import Image from "next/image";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Building2 } from "lucide-react";

interface CompanyHeroProps {
  slug: string;
  name: string;
  logo: string | null;
  banner: string | null;
  industry: string | null;
  type: string | null;
  size: string | null;
  verified: boolean;
  claimed: boolean;
}

const SIZE_LABELS: Record<string, string> = {
  SIZE_1_10: "1-10",
  SIZE_11_50: "11-50",
  SIZE_51_200: "51-200",
  SIZE_201_500: "201-500",
  SIZE_501_1000: "501-1000",
  SIZE_1001_PLUS: "1001+",
};

export function CompanyHero(props: CompanyHeroProps) {
  const { slug, name, logo, banner, industry, type, size, verified, claimed } = props;
  return (
    <div className="relative rounded-lg overflow-hidden bg-muted">
      <div
        className="h-40 sm:h-48 w-full bg-gradient-to-br from-primary/20 to-primary/5"
        style={banner ? { backgroundImage: "url(" + banner + ")", backgroundSize: "cover", backgroundPosition: "center" } : undefined}
      />
      <div className="absolute bottom-0 left-0 right-0 p-4 sm:p-6 flex flex-wrap items-end gap-4">
        <div className="flex items-end gap-4">
          {logo ? (
            <Image src={logo} alt="" width={80} height={80} className="h-16 w-16 sm:h-20 sm:w-20 rounded-lg border-2 border-background bg-background object-contain shadow" unoptimized />
          ) : (
            <div className="flex h-16 w-16 sm:h-20 sm:w-20 items-center justify-center rounded-lg border-2 border-background bg-background">
              <Building2 className="h-8 w-8 sm:h-10 sm:w-10 text-muted-foreground" />
            </div>
          )}
          <div className="pb-1">
            <div className="flex flex-wrap items-center gap-2">
              <h1 className="text-xl sm:text-2xl font-semibold text-foreground">{name}</h1>
              {verified && (
                <span className="rounded-md bg-green-100 px-2 py-0.5 text-xs font-medium text-green-800">
                  Verified
                </span>
              )}
            </div>
            <div className="flex flex-wrap gap-2 mt-2">
              {industry && <span className="rounded-md border border-border px-2 py-0.5 text-xs">{industry}</span>}
              {type && <span className="rounded-md border border-border px-2 py-0.5 text-xs">{type.replace(/_/g, " ")}</span>}
              {size && <span className="rounded-md border border-border px-2 py-0.5 text-xs">{SIZE_LABELS[size] ?? size}</span>}
            </div>
          </div>
        </div>
        <div className="ml-auto flex flex-wrap gap-2">
          <Button variant="outline" size="sm" asChild>
            <Link href={"/companies/" + slug + "/reviews/new"}>Write a Review</Link>
          </Button>
          {!claimed && (
            <Button variant="secondary" size="sm" asChild>
              <Link href={"/companies/" + slug + "#claim"}>Claim this company</Link>
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}
