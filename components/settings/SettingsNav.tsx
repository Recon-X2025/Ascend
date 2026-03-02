"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const links = [
  { href: "/settings/account", label: "Account" },
  { href: "/settings/privacy", label: "Privacy" },
  { href: "/settings/security", label: "Security" },
  { href: "/settings/notifications", label: "Notifications" },
  { href: "/settings/job-alerts", label: "Job alerts" },
  { href: "/settings/currency", label: "Currency" },
  { href: "/settings/billing", label: "Billing" },
];

export function SettingsNav() {
  const pathname = usePathname();

  return (
    <ul className="flex flex-wrap gap-2 md:flex-col md:gap-0 border-b border-border md:border-b-0 pb-4 md:pb-0">
      {links.map(({ href, label }) => {
        const isStub = href === "/settings/notifications" || href === "/settings/billing";
        const active = pathname === href;
        return (
          <li key={href}>
            <Link
              href={href}
              className={`block py-2 px-3 rounded-lg text-sm font-medium md:rounded-none md:rounded-l-lg md:border-l-2 md:border-transparent ${
                active
                  ? "text-accent-green md:border-accent-green"
                  : "text-text-secondary hover:text-text-primary hover:bg-muted"
              }`}
            >
              {label}
              {isStub && (
                <span className="ml-1.5 text-xs text-text-secondary">(soon)</span>
              )}
            </Link>
          </li>
        );
      })}
    </ul>
  );
}
