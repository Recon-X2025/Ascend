"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import useSWR from "swr";
import {
  LayoutDashboard,
  Users,
  Building2,
  AlertCircle,
  Flag,
  FileText,
  Receipt,
  BarChart2,
  GraduationCap,
  ShieldCheck,
  Shield,
  Store,
  TrendingUp,
  KeyRound,
  CreditCard,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";

const fetcher = (url: string) => fetch(url).then((r) => r.json());

const mainLinks = [
  { href: "/dashboard/admin", label: "Overview", icon: LayoutDashboard },
  { href: "/dashboard/admin/users", label: "Users", icon: Users },
  { href: "/dashboard/admin/companies", label: "Companies", icon: Building2 },
  {
    href: "/dashboard/admin/moderation",
    label: "Moderation",
    icon: AlertCircle,
    badge: true,
  },
  { href: "/dashboard/admin/feature-flags", label: "Feature Flags", icon: Flag },
  { href: "/dashboard/admin/audit", label: "Audit Log", icon: FileText },
  { href: "/dashboard/admin/analytics", label: "Analytics", icon: BarChart2 },
  { href: "/dashboard/admin/growth", label: "Growth", icon: TrendingUp },
  { href: "/dashboard/admin/trust", label: "Trust & Safety", icon: Shield },
  { href: "/dashboard/admin/enterprise", label: "Enterprise", icon: KeyRound },
  { href: "/dashboard/admin/invoices", label: "Invoices", icon: Receipt },
  { href: "/dashboard/admin/subscriptions", label: "Subscriptions", icon: CreditCard },
];

const mentorshipLinks: Array<{ href: string; label: string; icon: typeof GraduationCap; badge?: boolean; badgeKey?: string }> = [
  { href: "/dashboard/admin/mentorship", label: "Mentorship Ops", icon: GraduationCap, badge: true, badgeKey: "mentorshipOps" },
  { href: "/dashboard/admin/mentorship/verification", label: "Mentor Verification", icon: ShieldCheck },
  { href: "/dashboard/admin/mentorship/outcomes", label: "Outcome disputes", icon: FileText },
  { href: "/dashboard/admin/mentorship/tiers", label: "Mentor tiers", icon: GraduationCap },
];

const marketplaceLinks = [
  { href: "/dashboard/admin/marketplace", label: "Marketplace", icon: Store },
  { href: "/dashboard/admin/marketplace/providers", label: "Providers", icon: Users },
];

export function AdminNav() {
  const pathname = usePathname();
  const { data: stats } = useSWR<{ pending?: number }>(
    "/api/admin/moderation/stats",
    fetcher,
    { refreshInterval: 60000 }
  );
  const { data: opsOverview } = useSWR<{ alerts?: { unread?: number } }>(
    "/api/admin/mentorship/overview",
    fetcher,
    { refreshInterval: 60000 }
  );

  const linkEl = (
    href: string,
    label: string,
    Icon: typeof LayoutDashboard,
    badge?: boolean,
    badgeKey?: string
  ) => {
    const active =
      href === "/dashboard/admin"
        ? pathname === href
        : href === "/dashboard/admin/mentorship"
          ? pathname === href
          : pathname.startsWith(href);
    let count: number | null = null;
    if (badge && badgeKey === "mentorshipOps") count = opsOverview?.alerts?.unread ?? 0;
    else if (badge) count = stats?.pending ?? 0;
    return (
      <Link
        key={href}
        href={href}
        className={cn(
          "flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium transition-colors",
          active
            ? "bg-primary/10 text-primary"
            : "text-muted-foreground hover:bg-muted hover:text-foreground"
        )}
      >
        <Icon className="h-4 w-4 shrink-0" />
        <span className="flex-1">{label}</span>
        {typeof count === "number" && count > 0 && (
          <Badge variant="secondary" className="shrink-0">
            {count}
          </Badge>
        )}
      </Link>
    );
  };

  return (
    <nav className="flex flex-col gap-0.5">
      {mainLinks.map(({ href, label, icon, badge }) => linkEl(href, label, icon, badge))}
      <div className="pt-4 mt-2 border-t border-border">
        <p className="px-3 py-1 text-xs font-medium text-muted-foreground flex items-center gap-2">
          <GraduationCap className="h-3.5 w-3.5" />
          Mentorship
        </p>
        <div className="flex flex-col gap-0.5 mt-1">
          {mentorshipLinks.map(({ href, label, icon, badge, badgeKey }) =>
            linkEl(href, label, icon, badge, badgeKey)
          )}
        </div>
      </div>
      <div className="pt-4 mt-2 border-t border-border">
        <p className="px-3 py-1 text-xs font-medium text-muted-foreground flex items-center gap-2">
          <Store className="h-3.5 w-3.5" />
          Marketplace
        </p>
        <div className="flex flex-col gap-0.5 mt-1">
          {marketplaceLinks.map(({ href, label, icon }) => linkEl(href, label, icon))}
        </div>
      </div>
    </nav>
  );
}
