import Image from "next/image";
import Link from "next/link";
import { Building2, Star } from "lucide-react";

interface CompanySnippetCardProps {
  company: { id: string; slug: string; name: string; logo: string | null; industry: string | null; size: string | null };
  rating?: { overallAvg: number; reviewCount: number } | null;
}

export function CompanySnippetCard({ company, rating }: CompanySnippetCardProps) {
  return (
    <div className="ascend-card p-4">
      <div className="flex items-center gap-3">
        {company.logo ? (
          <Image src={company.logo} alt="" width={48} height={48} className="h-12 w-12 rounded object-contain bg-muted" unoptimized />
        ) : (
          <div className="h-12 w-12 rounded bg-muted flex items-center justify-center">
            <Building2 className="h-6 w-6 text-muted-foreground" />
          </div>
        )}
        <div className="min-w-0 flex-1">
          <Link href={"/companies/" + company.slug} className="font-medium hover:underline">
            {company.name}
          </Link>
          {(company.industry || company.size) && (
            <p className="text-xs text-muted-foreground mt-0.5">
              {[company.industry, company.size].filter(Boolean).join(" · ")}
            </p>
          )}
          {rating && rating.reviewCount >= 3 && (
            <p className="text-xs mt-1 flex items-center gap-1">
              <Star className="h-3.5 w-3.5 fill-amber-400 text-amber-400" />
              {rating.overallAvg.toFixed(1)} ({rating.reviewCount} reviews)
            </p>
          )}
        </div>
      </div>
      <Link href={"/companies/" + company.slug} className="mt-3 block text-sm text-primary hover:underline">
        View Company
      </Link>
    </div>
  );
}
