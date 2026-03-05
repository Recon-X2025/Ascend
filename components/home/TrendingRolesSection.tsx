"use client";

import { TrendingRolesStrip } from "@/components/salary/TrendingRolesStrip";
import Link from "next/link";

export function TrendingRolesSection() {
  return (
    <section className="py-12 px-6 md:px-12 max-w-[1280px] mx-auto border-b border-border">
      <div className="flex items-center justify-between mb-4">
        <h2 className="font-display font-bold text-ink text-xl">Trending roles</h2>
        <Link href="/salary" className="text-sm font-medium text-green hover:underline">
          View all →
        </Link>
      </div>
      <TrendingRolesStrip />
    </section>
  );
}
