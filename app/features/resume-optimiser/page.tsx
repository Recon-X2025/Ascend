import { FeaturePageHero } from "@/components/features/FeaturePageHero";
import { FeatureProofPoints } from "@/components/features/FeatureProofPoints";
import { FeatureCtaBand } from "@/components/features/FeatureCtaBand";
import { ResumeOptimiserDemo } from "@/components/features/ResumeOptimiserDemo";

const CTA_HREF = "/auth/register?from=resume-optimiser";

const PROOF_POINTS = [
  {
    icon: "—",
    label: "Gap analysis per JD",
    description:
      "See exactly what the job requires vs what your resume shows. No guessing which skills are missing.",
  },
  {
    icon: "—",
    label: "Fact-bound rewrites",
    description:
      "AI rewrites are based only on what's already in your resume. Nothing fabricated, nothing added that you can't back up.",
  },
  {
    icon: "—",
    label: "ATS score included",
    description:
      "Know how your resume performs against automated screening before it reaches a human.",
  },
];

export default function ResumeOptimiserFeaturePage() {
  return (
    <div style={{ backgroundColor: "var(--bg)" }}>
      <FeaturePageHero
        label="RESUME OPTIMISER"
        headline="Your resume, built for the role."
        subheading="Paste a job description. Get a gap analysis and AI-suggested rewrites — specific to that role, not generic advice."
        ctaHref={CTA_HREF}
      />
      <ResumeOptimiserDemo />
      <FeatureProofPoints points={PROOF_POINTS} />
      <FeatureCtaBand
        headline="Ready to optimise your resume?"
        subtext="Get role-specific rewrites and ATS scores on Ascend."
        ctaHref={CTA_HREF}
      />
    </div>
  );
}
