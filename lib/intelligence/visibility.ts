/**
 * Phase 10B: Profile Visibility Score breakdown.
 * Factors: completeness (30), keyword density (25), recency (20), application activity (15), social proof (10).
 */

export interface VisibilityFactors {
  completeness: number;
  keywordDensity: number;
  recency: number;
  applicationActivity: number;
  socialProof: number;
}

export interface VisibilityScoreResult {
  score: number;
  factors: VisibilityFactors;
  recommendations: string[];
}

const WEIGHTS = {
  completeness: 30,
  keywordDensity: 25,
  recency: 20,
  applicationActivity: 15,
  socialProof: 10,
} as const;

/**
 * Compute completeness (0–100) from profile fields.
 * Headline, summary, photo, location, current role, skills >= 5, experience >= 1, education.
 */
export function scoreCompleteness(params: {
  hasHeadline: boolean;
  hasSummary: boolean;
  hasPhoto: boolean;
  hasLocation: boolean;
  hasCurrentRole: boolean;
  skillsCount: number;
  experienceCount: number;
  hasEducation: boolean;
}): number {
  const checks = [
    params.hasHeadline,
    params.hasSummary,
    params.hasPhoto,
    params.hasLocation,
    params.hasCurrentRole,
    params.skillsCount >= 5,
    params.experienceCount >= 1,
    params.hasEducation,
  ];
  const score = (checks.filter(Boolean).length / checks.length) * 100;
  return Math.round(score);
}

/**
 * Keyword density: 0–100 based on how many of the target keywords appear in skills + headline + summary.
 */
export function scoreKeywordDensity(
  userText: string,
  targetKeywords: string[]
): number {
  if (targetKeywords.length === 0) return 100;
  const lower = userText.toLowerCase();
  const matchCount = targetKeywords.filter((k) =>
    lower.includes(k.toLowerCase().trim())
  ).length;
  return Math.round((matchCount / targetKeywords.length) * 100);
}

/**
 * Recency: full score if updated within 30 days, half if 30–90 days, 0 if > 90 days.
 */
export function scoreRecency(lastUpdatedAt: Date | null): number {
  if (!lastUpdatedAt) return 0;
  const days = (Date.now() - lastUpdatedAt.getTime()) / (24 * 60 * 60 * 1000);
  if (days <= 30) return 100;
  if (days <= 90) return 50;
  return 0;
}

/**
 * Application activity: 100 if at least 1 application in last 30 days, else 0.
 */
export function scoreApplicationActivity(applicationsInLast30Days: number): number {
  return applicationsInLast30Days >= 1 ? 100 : 0;
}

/**
 * Social proof: 100 if has LinkedIn (Account with provider linkedin), else 0.
 */
export function scoreSocialProof(hasLinkedIn: boolean): number {
  return hasLinkedIn ? 100 : 0;
}

/**
 * Weighted total and build recommendations.
 */
export function computeVisibilityResult(
  factors: VisibilityFactors
): VisibilityScoreResult {
  const total =
    (factors.completeness / 100) * WEIGHTS.completeness +
    (factors.keywordDensity / 100) * WEIGHTS.keywordDensity +
    (factors.recency / 100) * WEIGHTS.recency +
    (factors.applicationActivity / 100) * WEIGHTS.applicationActivity +
    (factors.socialProof / 100) * WEIGHTS.socialProof;
  const score = Math.round(Math.min(100, total));

  const recommendations: string[] = [];
  if (factors.completeness < 80) {
    if (factors.completeness < 50) {
      recommendations.push(
        "Add a profile photo — profiles with photos get 3× more views"
      );
    }
    recommendations.push(
      "Complete your profile — headline, summary, location, and at least one experience help recruiters find you"
    );
  }
  if (factors.recency < 100) {
    recommendations.push(
      "Update your profile — it hasn't been edited recently; a fresh profile ranks higher"
    );
  }
  if (factors.keywordDensity < 70) {
    recommendations.push(
      "Add more skills relevant to your target role so you appear in more searches"
    );
  }
  if (factors.applicationActivity < 100) {
    recommendations.push(
      "Apply to at least one job this month — active candidates get more visibility"
    );
  }
  if (factors.socialProof < 100) {
    recommendations.push("Connect your LinkedIn account for social proof");
  }

  return {
    score,
    factors,
    recommendations: recommendations.slice(0, 3),
  };
}
