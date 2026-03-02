"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

export function MentorDashboardNav() {
  const pathname = usePathname();
  const base = "/dashboard/mentor";
  const links = [
    { href: base, label: "Dashboard" },
    { href: `${base}/tier-history`, label: "Tier history" },
    { href: `${base}/analytics`, label: "Analytics" },
  ];
  return (
    <nav className="flex gap-4 mb-6 border-b border-[#0F1A0F]/10 pb-4">
      {links.map(({ href, label }) => (
        <Link
          key={href}
          href={href}
          className={`text-sm font-medium ${pathname === href ? "text-[#0F1A0F] underline" : "text-[#0F1A0F]/70 hover:text-[#0F1A0F]"}`}
        >
          {label}
        </Link>
      ))}
    </nav>
  );
}
