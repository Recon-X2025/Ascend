"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";

const TABS = [
  { href: "", label: "Overview" },
  { href: "/reviews", label: "Reviews" },
  { href: "/interviews", label: "Interview Experiences" },
  { href: "/salaries", label: "Salaries" },
  { href: "/qa", label: "Q&A" },
  { href: "/jobs", label: "Jobs" },
] as const;

interface CompanyTabsProps {
  slug: string;
}

export function CompanyTabs({ slug }: CompanyTabsProps) {
  const pathname = usePathname();
  const base = `/companies/${slug}`;

  return (
    <nav className="border-b border-border mt-6">
      <ul className="flex flex-wrap gap-1">
        {TABS.map(({ href, label }) => {
          const path = href ? `${base}${href}` : base;
          const isJobs = href === "/jobs";
          const to = isJobs ? `/jobs?company=${slug}` : path;
          const active = isJobs ? false : (pathname === path || (path !== base && pathname.startsWith(path)));
          return (
            <li key={href || "overview"}>
              <Link
                href={to}
                className={cn(
                  "inline-block px-4 py-3 text-sm font-medium border-b-2 -mb-px transition-colors",
                  active ? "border-primary text-primary" : "border-transparent text-muted-foreground hover:text-foreground"
                )}
              >
                {label}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
