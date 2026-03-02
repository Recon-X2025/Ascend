import { FeaturePageHero } from "@/components/features/FeaturePageHero";
import { FeatureProofPoints } from "@/components/features/FeatureProofPoints";
import { FeatureCtaBand } from "@/components/features/FeatureCtaBand";
import { FitScoreDemo } from "@/components/features/FitScoreDemo";

const CTA_HREF = "/auth/register?from=fit-score";

const PROOF_POINTS = [
  {
    icon: "—",
    label: "100-point model",
    description:
      "Scored across skills, experience, education, location, keywords, and profile completeness. Nothing is a black box.",
  },
  {
    icon: "—",
    label: "Role-specific, not generic",
    description:
      "Your score recalculates for every job. A 94 on one role and a 61 on another tells you exactly where to focus.",
  },
  {
    icon: "—",
    label: "Apply with conviction",
    description:
      "Stop guessing if you're a fit. Know your standing before you spend time on an application.",
  },
];

export default function FitScoreFeaturePage() {
  return (
    <div style={{ backgroundColor: "var(--bg)" }}>
      <FeaturePageHero
        label="FIT SCORE"
        headline="Know before you apply."
        subheading="Every job on Ascend shows you a match score against your profile — before you click."
        ctaHref={CTA_HREF}
      />
      <FitScoreDemo />
      <FeatureProofPoints points={PROOF_POINTS} />
      <FeatureCtaBand
        headline="Ready to see your score?"
        subtext="Join Ascend and get your fit score on every job."
        ctaHref={CTA_HREF}
      />
    </div>
  );
}
