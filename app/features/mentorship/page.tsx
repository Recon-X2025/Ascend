import { FeaturePageHero } from "@/components/features/FeaturePageHero";
import { FeatureProofPoints } from "@/components/features/FeatureProofPoints";
import { FeatureCtaBand } from "@/components/features/FeatureCtaBand";
import { MentorshipDemo } from "@/components/features/MentorshipDemo";

const CTA_HREF = "/auth/register?from=mentorship";

const PROOF_POINTS = [
  {
    icon: "—",
    label: "Vetted, not random",
    description:
      "Every mentor on Ascend has opted in and been reviewed. No cold outreach to people who never agreed to help.",
  },
  {
    icon: "—",
    label: "Transition-matched",
    description:
      "Mentors are tagged by the specific moves they've made: IC to manager, startup to FAANG, India to global. You find someone who's been exactly where you are.",
  },
  {
    icon: "—",
    label: "Outcome-tracked",
    description:
      "When a mentee lands the role, they can credit their mentor. Mentor profiles show real outcomes, not just availability.",
  },
];

export default function MentorshipFeaturePage() {
  return (
    <div style={{ backgroundColor: "var(--bg)" }}>
      <FeaturePageHero
        label="MENTORSHIP"
        headline="Someone already made the move you're planning."
        subheading="Connect with vetted mentors who've navigated the exact transition you're considering — and opted in to help."
        ctaHref={CTA_HREF}
      />
      <MentorshipDemo />
      <FeatureProofPoints points={PROOF_POINTS} />
      <FeatureCtaBand
        headline="Ready to find your mentor?"
        subtext="Join Ascend and connect with mentors who've been there."
        ctaHref={CTA_HREF}
      />
    </div>
  );
}
