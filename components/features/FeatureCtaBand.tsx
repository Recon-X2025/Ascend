import Link from "next/link";

interface FeatureCtaBandProps {
  headline: string;
  subtext: string;
  ctaHref: string;
}

export function FeatureCtaBand({ headline, subtext, ctaHref }: FeatureCtaBandProps) {
  return (
    <section
      className="py-20 text-center"
      style={{ backgroundColor: "var(--ink)" }}
    >
      <h2
        className="font-display font-bold text-white"
        style={{ fontSize: "2rem" }}
      >
        {headline}
      </h2>
      <p
        className="font-body mt-2"
        style={{
          fontSize: "1rem",
          color: "rgba(255,255,255,0.6)",
        }}
      >
        {subtext}
      </p>
      <Link
        href={ctaHref}
        className="inline-flex items-center font-display font-semibold text-white mt-8 rounded-lg transition-colors hover:opacity-95"
        style={{
          backgroundColor: "var(--green)",
          padding: "14px 32px",
        }}
      >
        Create your free account →
      </Link>
    </section>
  );
}
