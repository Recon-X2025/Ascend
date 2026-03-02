"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { LayoutDashboard, Briefcase, BarChart2 } from "lucide-react";
import { cn } from "@/lib/utils";

const links = [
  { href: "/dashboard/recruiter", label: "Overview", icon: LayoutDashboard },
  { href: "/dashboard/recruiter/jobs", label: "Jobs", icon: Briefcase },
  { href: "/dashboard/recruiter/intelligence", label: "Intelligence", icon: BarChart2 },
];

export function RecruiterNav() {
  const pathname = usePathname();

  return (
    <nav className="flex flex-col gap-0.5">
      {links.map(({ href, label, icon: Icon }) => {
        const active =
          href === "/dashboard/recruiter"
            ? pathname === href
            : pathname.startsWith(href);
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
            {label}
          </Link>
        );
      })}
    </nav>
  );
}
