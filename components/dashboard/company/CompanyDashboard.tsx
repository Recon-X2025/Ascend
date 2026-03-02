"use client";

import { useState } from "react";
import Link from "next/link";
import { CompanyDashboardOverview } from "./CompanyDashboardOverview";
import { CompanyDashboardEditProfile } from "./CompanyDashboardEditProfile";
import { CompanyDashboardMedia } from "./CompanyDashboardMedia";
import { CompanyDashboardBenefits } from "./CompanyDashboardBenefits";
import { CompanyDashboardReviews } from "./CompanyDashboardReviews";
import { CompanyDashboardTeam } from "./CompanyDashboardTeam";
import { CompanyDashboardMobility } from "./CompanyDashboardMobility";
import { cn } from "@/lib/utils";

const TABS = [
  { id: "overview", label: "Overview" },
  { id: "profile", label: "Edit Profile" },
  { id: "media", label: "Media" },
  { id: "benefits", label: "Benefits" },
  { id: "reviews", label: "Reviews" },
  { id: "team", label: "Team" },
  { id: "mobility", label: "Mobility" },
] as const;

const LINKS = [
  { href: "/dashboard/company/careers", label: "Careers" },
  { href: "/dashboard/company/api", label: "API" },
  { href: "/dashboard/company/sso", label: "SSO" },
] as const;

type TabId = (typeof TABS)[number]["id"];

interface CompanyDashboardProps {
  slug: string;
  companyName: string;
}

export function CompanyDashboard({ slug, companyName }: CompanyDashboardProps) {
  const [tab, setTab] = useState<TabId>("overview");

  return (
    <div>
      <h1 className="text-2xl font-semibold">Company Admin Dashboard</h1>
      <p className="text-muted-foreground mt-1">{companyName}</p>
      <nav className="border-b border-border mt-6 flex flex-wrap gap-1">
        {TABS.map((t) => (
          <button
            key={t.id}
            type="button"
            onClick={() => setTab(t.id)}
            className={cn(
              "px-4 py-3 text-sm font-medium border-b-2 -mb-px transition-colors",
              tab === t.id ? "border-primary text-primary" : "border-transparent text-muted-foreground hover:text-foreground"
            )}
          >
            {t.label}
          </button>
        ))}
        {LINKS.map((l) => (
          <Link
            key={l.href}
            href={l.href}
            className="px-4 py-3 text-sm font-medium border-b-2 -mb-px border-transparent text-muted-foreground hover:text-foreground"
          >
            {l.label}
          </Link>
        ))}
      </nav>
      <div className="mt-6">
        {tab === "overview" && <CompanyDashboardOverview slug={slug} />}
        {tab === "profile" && <CompanyDashboardEditProfile slug={slug} />}
        {tab === "media" && <CompanyDashboardMedia slug={slug} />}
        {tab === "benefits" && <CompanyDashboardBenefits slug={slug} />}
        {tab === "reviews" && <CompanyDashboardReviews slug={slug} />}
        {tab === "team" && <CompanyDashboardTeam slug={slug} />}
        {tab === "mobility" && <CompanyDashboardMobility slug={slug} />}
      </div>
    </div>
  );
}
