"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

export type LegalHeading = { id: string; label: string };

export function LegalSidebar({ headings }: { headings: LegalHeading[] }) {
  const [activeId, setActiveId] = useState<string | null>(null);

  useEffect(() => {
    if (typeof window === "undefined" || headings.length === 0) return;
    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) {
            setActiveId(entry.target.id);
            break;
          }
        }
      },
      { rootMargin: "-88px 0% -70% 0%", threshold: 0 }
    );
    headings.forEach(({ id }) => {
      const el = document.getElementById(id);
      if (el) observer.observe(el);
    });
    return () => observer.disconnect();
  }, [headings]);

  return (
    <aside
      className="hidden lg:block w-[200px] shrink-0 font-body text-[0.8rem]"
      style={{ position: "sticky", top: 88 }}
    >
      <p className="font-semibold uppercase tracking-wider text-ink-4 mb-3">In this document</p>
      <nav className="space-y-1.5">
        {headings.map(({ id, label }) => (
          <Link
            key={id}
            href={`#${id}`}
            className={`block transition-colors ${
              activeId === id
                ? "text-green font-medium"
                : "text-ink-4 hover:text-ink-3"
            }`}
          >
            {label}
          </Link>
        ))}
      </nav>
    </aside>
  );
}
