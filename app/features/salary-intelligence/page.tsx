import { FeaturePageHero } from "@/components/features/FeaturePageHero";
import { FeatureProofPoints } from "@/components/features/FeatureProofPoints";
import { FeatureCtaBand } from "@/components/features/FeatureCtaBand";
import { SalaryIntelligenceDemo } from "@/components/features/SalaryIntelligenceDemo";

const CTA_HREF = "/auth/register?from=salary-intelligence";

const PROOF_POINTS = [
  {
    icon: "—",
    label: "Sourced from real job data",
    description:
      "Built from 26,985+ indexed job descriptions with salary signals, not self-reported surveys that skew high.",
  },
  {
    icon: "—",
    label: "Slice it your way",
    description:
      "Filter by role, city, company size, or years of experience. See exactly where you stand in your specific market.",
  },
  {
    icon: "—",
    label: "Negotiate with data",
    description:
      "Walk into every conversation knowing the range. Stop leaving money on the table.",
  },
];

export default function SalaryIntelligenceFeaturePage() {
  return (
    <div style={{ backgroundColor: "var(--bg)" }}>
      <FeaturePageHero
        label="SALARY INTELLIGENCE"
        headline="Know what you're worth."
        subheading="Real compensation data by role, company, city, and years of experience — not survey estimates."
        ctaHref={CTA_HREF}
      />
      <SalaryIntelligenceDemo />
      <FeatureProofPoints points={PROOF_POINTS} />
      <FeatureCtaBand
        headline="Ready to know your market value?"
        subtext="Get salary insights tailored to your role and location."
        ctaHref={CTA_HREF}
      />
    </div>
  );
}
