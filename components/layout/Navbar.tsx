"use client";

import { useState, useEffect, useRef, useMemo } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { signOut, useSession } from "next-auth/react";
import useSWR from "swr";
import { Menu, ChevronDown } from "lucide-react";
import { NotificationCentre } from "@/components/notifications/NotificationCentre";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Container } from "@/components/layout/Container";

const LOGGED_OUT_LINKS = [
  { href: "/jobs", label: "Jobs" },
  { href: "/companies", label: "Companies" },
  { href: "/salary", label: "Salary" },
];

const DISCOVER_ITEMS = [
  { href: "/jobs", label: "Jobs" },
  { href: "/companies", label: "Companies" },
  { href: "/salary", label: "Salary Insights" },
  { href: "/mentorship", label: "Mentorship" },
];

const MY_CAREER_ITEMS_BASE = [
  { href: "/my-career/dashboard", label: "Dashboard" },
  { href: "/my-career/resume-optimiser", label: "Resume Optimiser" },
  { href: "/my-career/fit-score", label: "Fit Score" },
  { href: "/my-career/profile", label: "My Profile" },
  { href: "/my-career/saved", label: "Saved" },
];

const NETWORK_ITEMS = [
  { href: "/network/connections", label: "Connections" },
  { href: "/network/messages", label: "Messages" },
  { href: "/network/updates", label: "Career Updates" },
];

const fetcher = (url: string) => fetch(url).then((r) => r.json());

function isGroupActive(pathname: string | null, items: { href: string }[]) {
  return items.some((item) => pathname?.startsWith(item.href));
}

function Brand() {
  return (
    <Link href="/" className="flex flex-col font-display font-extrabold text-[1.15rem] text-ink tracking-wide">
      <span>Ascend</span>
      <span className="font-body text-[0.58rem] font-normal tracking-[0.2em] uppercase text-ink-4">
        A Coheron Product
      </span>
    </Link>
  );
}

export function Navbar() {
  const pathname = usePathname();
  const { data: session, status } = useSession();
  const isAuthPage = pathname?.startsWith("/auth");
  const isLoggedIn = !!session?.user;
  const { data: mentorshipMe } = useSWR<{ isMentor?: boolean }>(
    isLoggedIn ? "/api/mentorship/me" : null,
    fetcher
  );
  const MY_CAREER_ITEMS = useMemo(
    () => [
      ...MY_CAREER_ITEMS_BASE,
      ...(mentorshipMe?.isMentor
        ? [{ href: "/dashboard/mentor", label: "Mentor Dashboard" }]
        : [{ href: "/mentorship/become-a-mentor", label: "Become a Mentor" }]),
    ],
    [mentorshipMe?.isMentor]
  );
  const LOGGED_IN_GROUPS = useMemo(
    () => [
      { id: "discover", label: "Discover", items: DISCOVER_ITEMS },
      { id: "my-career", label: "My Career", items: MY_CAREER_ITEMS },
      { id: "network", label: "Network", items: NETWORK_ITEMS },
    ],
    [MY_CAREER_ITEMS]
  );
  const [openDropdown, setOpenDropdown] = useState<string | null>(null);
  const navRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setOpenDropdown(null);
  }, [pathname]);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (navRef.current && !navRef.current.contains(e.target as Node)) {
        setOpenDropdown(null);
      }
    }
    function handleEscape(e: KeyboardEvent) {
      if (e.key === "Escape") setOpenDropdown(null);
    }
    document.addEventListener("mousedown", handleClickOutside);
    document.addEventListener("keydown", handleEscape);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("keydown", handleEscape);
    };
  }, []);

  const dropdownPanelStyle = {
    background: "var(--surface)",
    border: "1px solid var(--border)",
    borderRadius: "10px",
    boxShadow: "0 8px 32px rgba(0,0,0,0.08)",
    padding: "6px",
    minWidth: "200px",
    position: "absolute" as const,
    top: "calc(100% + 8px)",
    left: 0,
    zIndex: 200,
  };

  return (
    <header className="sticky top-0 z-[100] h-16 w-full border-b border-border bg-bg/94 backdrop-blur-[12px]">
      <Container className="flex h-full items-center justify-between">
        <Brand />

        <div ref={navRef} className="hidden md:flex flex-1 items-center justify-end gap-6 min-w-0">
        {/* Auth pages: logo only + single opposite-action button */}
        {isAuthPage && (
          <div className="flex items-center gap-2 min-h-[44px]">
            {pathname === "/auth/login" ? (
              <Button variant="ghost" size="sm" asChild>
                <Link href="/auth/register">Create account</Link>
              </Button>
            ) : (
              <Button variant="ghost" size="sm" asChild>
                <Link href="/auth/login">Sign in</Link>
              </Button>
            )}
          </div>
        )}

        {/* Non-auth: marketing nav (logged-out) or product nav (logged-in) */}
        {!isAuthPage && (
          <nav className="flex items-center gap-6">
            {!isLoggedIn && (
              <>
                {LOGGED_OUT_LINKS.map(({ href, label }) => {
                  const active = pathname?.startsWith(href);
                  return (
                    <Link
                      key={href}
                      href={href}
                      className={`font-body text-[0.875rem] transition-colors duration-150 ${
                        active ? "text-green font-medium" : "text-ink-3 hover:text-ink"
                      }`}
                    >
                      {label}
                    </Link>
                  );
                })}
              </>
            )}
            {isLoggedIn && (
              <>
                {LOGGED_IN_GROUPS.map((group) => {
                  const isOpen = openDropdown === group.id;
                  const active = isGroupActive(pathname, group.items);
                  return (
                    <div key={group.id} className="relative">
                      <button
                        type="button"
                        onClick={() => setOpenDropdown(isOpen ? null : group.id)}
                        className={`font-body text-[0.875rem] transition-colors duration-150 flex items-center gap-1 ${
                          active ? "text-green font-medium" : "text-ink-3 hover:text-ink"
                        }`}
                        aria-expanded={isOpen}
                        aria-haspopup="true"
                      >
                        {group.label}
                        <ChevronDown
                          className="w-4 h-4 transition-transform duration-200"
                          style={{ transform: isOpen ? "rotate(180deg)" : "rotate(0deg)" }}
                          aria-hidden
                        />
                      </button>
                      {isOpen && (
                        <div style={dropdownPanelStyle} role="menu">
                          {group.items.map(({ href, label }) => {
                            const itemActive = pathname?.startsWith(href);
                            return (
                              <Link
                                key={href}
                                href={href}
                                role="menuitem"
                                className={`flex items-center gap-[10px] py-[9px] px-[14px] rounded-md font-body text-[0.875rem] transition-all duration-150 hover:bg-green-light hover:text-green-dark ${
                                  itemActive ? "text-green font-medium" : "text-ink-2"
                                }`}
                                onClick={() => setOpenDropdown(null)}
                              >
                                {label}
                              </Link>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  );
                })}
              </>
            )}
          </nav>
        )}

        {/* Right side: auth pages handled above; otherwise language + auth buttons or avatar */}
        {!isAuthPage && (
          <div className="flex items-center gap-2 min-h-[44px] shrink-0">
            {status === "loading" ? (
              <>
                <Button variant="ghost" size="sm" asChild>
                  <Link href="/auth/login">Sign in</Link>
                </Button>
                <Button variant="primary" size="sm" asChild>
                  <Link href="/auth/register">Get started</Link>
                </Button>
              </>
            ) : isLoggedIn ? (
              <>
                <NotificationCentre />
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <button
                      className="rounded-full focus:outline-none focus-visible:ring-2 focus-visible:ring-green ring-offset-2 min-w-[44px] min-h-[44px] flex items-center justify-center"
                      aria-label="Open account menu"
                    >
                      <Avatar className="h-8 w-8">
                        <AvatarImage src={session?.user?.image ?? undefined} alt="" />
                        <AvatarFallback className="bg-green-light text-green-dark text-sm">
                          {session?.user?.name
                            ?.split(" ")
                            .map((n) => n[0])
                            .join("")
                            .toUpperCase()
                            .slice(0, 2) ?? "?"}
                        </AvatarFallback>
                      </Avatar>
                    </button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-48">
                    <DropdownMenuItem asChild>
                      <Link href="/profile/edit">Profile</Link>
                    </DropdownMenuItem>
                    <DropdownMenuItem asChild>
                      <Link href="/settings/account">Settings</Link>
                    </DropdownMenuItem>
                    <DropdownMenuItem
                      onSelect={(e) => {
                        e.preventDefault();
                        signOut({ callbackUrl: "/" });
                      }}
                    >
                      Sign out
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </>
            ) : (
              <>
                <Button variant="ghost" size="sm" asChild>
                  <Link href="/auth/login">Sign in</Link>
                </Button>
                <Button variant="primary" size="sm" asChild>
                  <Link href="/auth/register">Get started</Link>
                </Button>
              </>
            )}
          </div>
        )}
        </div>

        {/* Mobile menu */}
        <div className="flex md:hidden items-center gap-2">
          {!isAuthPage && isLoggedIn && <NotificationCentre />}
          <Sheet>
            <SheetTrigger asChild>
              <Button variant="ghost" size="icon" aria-label="Open menu" className="min-w-[44px] min-h-[44px]">
                <Menu className="h-5 w-5" />
              </Button>
            </SheetTrigger>
            <SheetContent side="right" className="w-[280px]">
              <SheetHeader>
                <SheetTitle className="sr-only">Menu</SheetTitle>
              </SheetHeader>
              <div className="flex flex-col gap-4 pt-6">
                {isAuthPage ? (
                  <div className="pt-2">
                    {pathname === "/auth/login" ? (
                      <Link href="/auth/register" className="block py-2 text-sm font-medium text-ink">
                        Create account
                      </Link>
                    ) : (
                      <Link href="/auth/login" className="block py-2 text-sm font-medium text-ink">
                        Sign in
                      </Link>
                    )}
                  </div>
                ) : (
                  <>
                    {!isLoggedIn
                      ? LOGGED_OUT_LINKS.map(({ href, label }) => (
                          <Link
                            key={href}
                            href={href}
                            className={`text-sm font-medium ${
                              pathname?.startsWith(href) ? "text-green" : "text-ink"
                            }`}
                          >
                            {label}
                          </Link>
                        ))
                      : LOGGED_IN_GROUPS.map((group) => (
                          <div key={group.id}>
                            <p className="font-body text-[0.68rem] tracking-[0.2em] uppercase text-ink-4 mb-2">
                              {group.label}
                            </p>
                            <div className="flex flex-col gap-1">
                              {group.items.map(({ href, label }) => (
                                <Link
                                  key={href}
                                  href={href}
                                  className={`text-sm font-medium py-2 ${
                                    pathname?.startsWith(href) ? "text-green" : "text-ink"
                                  }`}
                                >
                                  {label}
                                </Link>
                              ))}
                            </div>
                          </div>
                        ))}
                    <div className="border-t border-border pt-4">
                      {isLoggedIn ? (
                        <>
                          <Link
                            href="/profile/edit"
                            className="block py-2 text-sm font-medium text-ink"
                          >
                            Profile
                          </Link>
                          <Link
                            href="/settings/account"
                            className="block py-2 text-sm font-medium text-ink"
                          >
                            Settings
                          </Link>
                          <button
                            type="button"
                            className="block py-2 text-sm font-medium text-ink w-full text-left"
                            onClick={() => signOut({ callbackUrl: "/" })}
                          >
                            Sign out
                          </button>
                        </>
                      ) : (
                        <>
                          <Link href="/auth/login" className="block py-2 text-sm font-medium text-ink">
                            Sign in
                          </Link>
                          <Link href="/auth/register" className="block py-2 text-sm font-medium text-green">
                            Get started
                          </Link>
                        </>
                      )}
                    </div>
                  </>
                )}
              </div>
            </SheetContent>
          </Sheet>
        </div>
      </Container>
    </header>
  );
}
