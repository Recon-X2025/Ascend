import { FeaturePageHero } from "@/components/features/FeaturePageHero";
import { FeatureProofPoints } from "@/components/features/FeatureProofPoints";
import { FeatureCtaBand } from "@/components/features/FeatureCtaBand";
import { CareerGraphDemo } from "@/components/features/CareerGraphDemo";

const CTA_HREF = "/auth/register?from=career-graph";

const PROOF_POINTS = [
  {
    icon: "—",
    label: "Context-anchored connections",
    description:
      "Every connection carries a relationship type: colleague, interviewer, mentor, peer. Your network means something, not just a number.",
  },
  {
    icon: "—",
    label: "Career trajectory, not follower count",
    description:
      "See how your network connects to your target roles and companies. Discover paths you didn't know existed.",
  },
  {
    icon: "—",
    label: "Private by default",
    description:
      "Your graph is yours. You control what's visible and to whom. No unsolicited outreach without context.",
  },
];

export default function CareerGraphFeaturePage() {
  return (
    <div style={{ backgroundColor: "var(--bg)" }}>
      <FeaturePageHero
        label="CAREER GRAPH"
        headline="Your network, with direction."
        subheading="Not a social feed. A map of the people who've shaped — and will shape — your career."
        ctaHref={CTA_HREF}
      />
      <CareerGraphDemo />
      <FeatureProofPoints points={PROOF_POINTS} />
      <FeatureCtaBand
        headline="Ready to map your career?"
        subtext="Build your career graph on Ascend."
        ctaHref={CTA_HREF}
      />
    </div>
  );
}
