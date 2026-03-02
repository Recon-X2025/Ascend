"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import { MapPin } from "lucide-react";
import { SaveJobButton } from "./SaveJobButton";
import { FitScoreBadge } from "./FitScoreBadge";
import { formatSalaryRange } from "@/lib/i18n/currency";

export interface JobCardData {
  id: number;
  slug: string;
  title: string;
  type: string;
  workMode: string;
  locations: string[];
  salaryVisible: boolean;
  salaryMin: number | null;
  salaryMax: number | null;
  salaryCurrency: string;
  companyName: string | null;
  company: { slug: string; name: string; logo: string | null; verified?: boolean } | null;
  publishedAt: string | null;
  applicationCount?: number;
  tags: string[];
  easyApply: boolean;
}

function formatSalary(
  salaryMin: number | null,
  salaryMax: number | null,
  salaryCurrency: string,
  preferredCurrency?: string | null
) {
  if (salaryMin == null && salaryMax == null) return "Not disclosed";
  if (preferredCurrency && salaryCurrency === "INR") {
    const str = formatSalaryRange(salaryMin, salaryMax, preferredCurrency, {
      approximate: preferredCurrency !== "INR",
    });
    if (str) return str;
  }
  const sym = salaryCurrency === "INR" ? "₹" : salaryCurrency === "USD" ? "$" : salaryCurrency;
  const min = salaryMin != null ? (salaryCurrency === "INR" ? salaryMin / 100000 : salaryMin) : null;
  const max = salaryMax != null ? (salaryCurrency === "INR" ? salaryMax / 100000 : salaryMax) : null;
  if (min != null && max != null) return sym + min + " – " + sym + max + " LPA";
  if (min != null) return sym + min + "+ LPA";
  if (max != null) return "Up to " + sym + max + " LPA";
  return "Not disclosed";
}

function formatDate(publishedAt: string | null) {
  if (!publishedAt) return "";
  const d = new Date(publishedAt);
  const now = new Date();
  const diff = Math.floor((now.getTime() - d.getTime()) / (1000 * 60 * 60 * 24));
  if (diff === 0) return "Today";
  if (diff === 1) return "1 day ago";
  if (diff < 7) return diff + " days ago";
  if (diff < 30) return Math.floor(diff / 7) + " weeks ago";
  return Math.floor(diff / 30) + " months ago";
}

export function JobCard({
  job,
  fitScore,
  preferredCurrency,
}: {
  job: JobCardData;
  fitScore?: number | null;
  preferredCurrency?: string | null;
}) {
  const companyName = job.company?.name ?? job.companyName ?? "Company";
  const companySlug = job.company?.slug;
  const [relativeDate, setRelativeDate] = useState<string>(() =>
    job.publishedAt ? job.publishedAt.slice(0, 10) : ""
  );
  useEffect(() => {
    setRelativeDate(formatDate(job.publishedAt));
  }, [job.publishedAt]);

  return (
    <div className="ascend-card flex items-start gap-3 p-4 hover:bg-muted/30 transition-colors">
      {job.company?.logo && (
        <div className="w-10 h-10 lg:w-14 lg:h-14 shrink-0 rounded-lg overflow-hidden bg-muted">
          <Image
            src={job.company.logo}
            alt=""
            width={56}
            height={56}
            className="h-full w-full object-contain"
          />
        </div>
      )}
      <div className="flex-1 min-w-0 flex flex-col gap-3">
        <div className="flex items-start justify-between gap-2">
          <h3 className="font-medium text-sm lg:text-base leading-snug line-clamp-2 min-w-0">
            <Link href={"/jobs/" + job.slug} className="text-foreground hover:underline">
              {job.title}
            </Link>
          </h3>
          <div className="flex items-center gap-1 shrink-0">
            {fitScore != null && <FitScoreBadge score={fitScore} size="sm" />}
            <SaveJobButton jobId={job.id} />
          </div>
        </div>
        <Link
          href={companySlug ? "/companies/" + companySlug : "#"}
          className="text-sm text-muted-foreground hover:underline -mt-1 block"
        >
          {companyName}
          {job.company?.verified && (
            <span className="ml-1 text-green-600 text-xs">Verified</span>
          )}
        </Link>
        <div className="flex flex-wrap gap-1.5 text-xs">
          {job.locations.length > 0 && (
            <span className="flex items-center gap-1 text-muted-foreground">
              <MapPin className="h-3.5 w-3.5" />
              {job.locations.join(", ")}
            </span>
          )}
          <span className="rounded bg-muted px-1.5 py-0.5">{job.workMode.replace(/_/g, " ")}</span>
          <span className="rounded bg-muted px-1.5 py-0.5">{job.type.replace(/_/g, " ")}</span>
          {job.easyApply && <span className="rounded bg-green-100 text-green-800 px-1.5 py-0.5">Easy Apply</span>}
          {job.tags.map((t) => (
            <span key={t} className="rounded border border-border px-1.5 py-0.5">{t}</span>
          ))}
        </div>
        <p className="text-sm text-muted-foreground">
          {formatSalary(job.salaryMin, job.salaryMax, job.salaryCurrency, preferredCurrency)}
        </p>
        <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
          {job.publishedAt && <span suppressHydrationWarning>{relativeDate}</span>}
          {job.applicationCount != null && job.applicationCount > 0 && (
            <span>{job.applicationCount} applicants</span>
          )}
        </div>
      </div>
    </div>
  );
}
