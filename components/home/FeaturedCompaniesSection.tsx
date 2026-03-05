"use client";

import Link from "next/link";

export function FeaturedCompaniesSection() {
  return (
    <section className="py-16 px-6 md:px-12 max-w-[1280px] mx-auto border-b border-border">
      <p className="font-body text-[0.68rem] tracking-[0.22em] uppercase text-green mb-4">
        Featured companies
      </p>
      <h2 className="font-display font-bold text-ink text-[clamp(1.6rem,3vw,2.4rem)] leading-tight mb-8">
        Explore companies hiring on Ascend
      </h2>
      <Link
        href="/companies"
        className="inline-flex items-center gap-2 font-body font-medium text-green hover:underline"
      >
        Browse all companies →
      </Link>
    </section>
  );
}
