"use client";

import useSWR from "swr";
import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Users, Building2, Briefcase, FileCheck, AlertCircle } from "lucide-react";

const fetcher = (url: string) => fetch(url).then((r) => r.json());

const statCards = [
  {
    key: "userCount",
    label: "Total Users",
    icon: Users,
    href: "/dashboard/admin/users",
  },
  {
    key: "companyCount",
    label: "Active Companies",
    icon: Building2,
    href: "/dashboard/admin/companies",
  },
  {
    key: "jobCount",
    label: "Live Jobs",
    icon: Briefcase,
    href: "/dashboard/admin",
  },
  {
    key: "applicationCount",
    label: "Total Applications",
    icon: FileCheck,
    href: "/dashboard/admin",
  },
  {
    key: "pendingReviews",
    label: "Pending Reviews",
    icon: AlertCircle,
    href: "/dashboard/admin/moderation",
  },
];

export function AdminDashboardClient() {
  const { data, isLoading } = useSWR("/api/dashboard/admin", fetcher, {
    refreshInterval: 60000,
  });

  if (isLoading) {
    return (
      <div className="max-w-6xl mx-auto px-4 py-8 space-y-6 animate-pulse">
        <div className="h-8 w-48 bg-muted rounded" />
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
          {[1, 2, 3, 4, 5].map((i) => (
            <div key={i} className="h-24 bg-muted rounded-xl" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto px-4 py-8 space-y-6">
      <h1 className="text-2xl font-bold text-foreground">Platform Admin</h1>

      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        {statCards.map(({ key, label, icon: Icon, href }) => (
          <Link key={key} href={href}>
            <Card className="h-full hover:border-primary/40 transition-colors">
              <CardHeader className="pb-1">
                <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                  <Icon className="h-4 w-4" /> {label}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-2xl font-bold">
                  {data?.[key as keyof typeof data] ?? 0}
                </p>
              </CardContent>
            </Card>
          </Link>
        ))}
      </div>

      <div className="flex flex-wrap gap-3 pt-4">
        <Link
          href="/dashboard/admin/users"
          className="text-sm text-primary hover:underline"
        >
          Manage Users
        </Link>
        <Link
          href="/dashboard/admin/companies"
          className="text-sm text-primary hover:underline"
        >
          Manage Companies
        </Link>
        <Link
          href="/dashboard/admin/moderation"
          className="text-sm text-primary hover:underline"
        >
          Moderation Queue
        </Link>
        <Link
          href="/dashboard/admin/feature-flags"
          className="text-sm text-primary hover:underline"
        >
          Feature Flags
        </Link>
        <Link
          href="/dashboard/admin/audit"
          className="text-sm text-primary hover:underline"
        >
          Audit Log
        </Link>
      </div>
    </div>
  );
}
