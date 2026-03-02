import Link from "next/link";

interface FeaturePageHeroProps {
  label: string;
  headline: string;
  subheading: string;
  ctaHref: string;
}

export function FeaturePageHero({ label, headline, subheading, ctaHref }: FeaturePageHeroProps) {
  return (
    <section
      className="pt-[100px] pb-16"
      style={{ backgroundColor: "var(--bg)" }}
    >
      <div className="max-w-[1100px] mx-auto px-4 sm:px-6">
        <p
          className="font-body font-semibold uppercase mb-4"
          style={{
            color: "var(--green)",
            letterSpacing: "0.14em",
            fontSize: "0.75rem",
          }}
        >
          {label}
        </p>
        <h1
          className="font-display font-extrabold leading-[1.1] max-w-[700px]"
          style={{
            fontSize: "clamp(2.5rem, 5vw, 3.75rem)",
            color: "var(--ink)",
          }}
        >
          {headline}
        </h1>
        <p
          className="font-body mt-4 max-w-[560px]"
          style={{
            fontSize: "1.125rem",
            color: "var(--ink-3)",
          }}
        >
          {subheading}
        </p>
        <Link
          href={ctaHref}
          className="inline-flex items-center font-display font-semibold text-white mt-8 rounded-lg transition-colors hover:opacity-95"
          style={{
            backgroundColor: "var(--green)",
            padding: "14px 28px",
          }}
        >
          Get started free →
        </Link>
      </div>
    </section>
  );
}
