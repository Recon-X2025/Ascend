"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Home, Search, Bell, FileText, User } from "lucide-react";
import { cn } from "@/lib/utils";
import { useSession } from "next-auth/react";

const TABS = [
  { href: "/dashboard", label: "Home", icon: Home },
  { href: "/jobs", label: "Jobs", icon: Search },
  { href: "/notifications", label: "Alerts", icon: Bell },
  { href: "/resume", label: "Resume", icon: FileText },
  { href: "/profile/edit", label: "Profile", icon: User },
];

export function BottomNav() {
  const { data: session } = useSession();
  const pathname = usePathname();

  if (!session?.user) return null;

  return (
    <nav
      className="fixed bottom-0 left-0 right-0 z-40 lg:hidden border-t border-border bg-background/95 backdrop-blur-sm"
      aria-label="Main navigation"
    >
      <div className="flex items-center justify-around h-16 px-2 safe-area-pb">
        {TABS.map(({ href, label, icon: Icon }) => {
          const active =
            pathname === href ||
            (href !== "/dashboard" && pathname?.startsWith(href + "/")) ||
            (href === "/dashboard" && pathname?.startsWith("/dashboard"));
          return (
            <Link
              key={href}
              href={href}
              className={cn(
                "flex flex-col items-center justify-center gap-1 flex-1 h-full min-w-[44px] min-h-[44px] rounded-lg transition-colors",
                active ? "text-primary" : "text-muted-foreground hover:text-foreground"
              )}
              aria-current={active ? "page" : undefined}
            >
              <Icon
                className={cn("h-5 w-5 shrink-0", active && "stroke-[2.5]")}
                aria-hidden
              />
              <span className="text-[10px] font-medium leading-none">{label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
