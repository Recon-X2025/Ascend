/**
 * BL-1: Profile view tracking and insights.
 * Records recruiter profile views and provides aggregated insights (company + time window).
 */

import { prisma } from "@/lib/prisma/client";
import { canUseFeature } from "@/lib/payments/gate";

export interface ProfileViewInsight {
  companyName: string;
  count: number;
  lastViewedAt: Date;
  /** Only present when user has whoViewedProfile (Premium) */
  viewerRole?: string;
}

export interface ProfileViewInsightsResult {
  totalViews: number;
  /** Aggregate by company; Premium sees names, Free gets empty or single aggregate */
  byCompany: ProfileViewInsight[];
  /** Whether user can see company names (whoViewedProfile gate) */
  canSeeCompanyNames: boolean;
}

/**
 * Record a profile view event when a recruiter views a seeker profile.
 * Call from profile page when viewer is RECRUITER and not owner.
 */
export async function recordProfileView(params: {
  viewerId: string;
  profileUserId: string;
  viewerCompanyId?: string | null;
  viewerCompanyName?: string | null;
  viewerRole?: string | null;
}): Promise<void> {
  const { viewerId, profileUserId, viewerCompanyId, viewerCompanyName, viewerRole } = params;
  await prisma.profileViewEvent.create({
    data: {
      viewerId,
      profileUserId,
      viewerCompanyId: viewerCompanyId ?? null,
      viewerCompanyName: viewerCompanyName ?? null,
      viewerRole: viewerRole ?? null,
    },
  });
}

/**
 * Get aggregated profile view insights for a user (the profile owner).
 * Premium: company names + counts. Free: total count only, byCompany is aggregate placeholder.
 */
export async function getProfileViewInsights(profileUserId: string): Promise<ProfileViewInsightsResult> {
  const { allowed: canSeeCompanyNames } = await canUseFeature(profileUserId, "whoViewedProfile");

  const events = await prisma.profileViewEvent.findMany({
    where: { profileUserId },
    orderBy: { viewedAt: "desc" },
    take: 500,
    select: {
      viewerCompanyId: true,
      viewerCompanyName: true,
      viewerRole: true,
      viewedAt: true,
    },
  });

  const totalViews = events.length;

  if (!canSeeCompanyNames) {
    return {
      totalViews,
      byCompany: totalViews > 0 ? [{ companyName: "Recruiters", count: totalViews, lastViewedAt: events[0]!.viewedAt }] : [],
      canSeeCompanyNames: false,
    };
  }

  const byCompanyMap = new Map<string, { count: number; lastViewedAt: Date; viewerRole?: string }>();
  for (const e of events) {
    const companyName = e.viewerCompanyName ?? (e.viewerCompanyId ? "A company" : "A recruiter");
    const existing = byCompanyMap.get(companyName);
    if (existing) {
      existing.count++;
      if (e.viewedAt > existing.lastViewedAt) {
        existing.lastViewedAt = e.viewedAt;
        if (e.viewerRole) existing.viewerRole = e.viewerRole;
      }
    } else {
      byCompanyMap.set(companyName, { count: 1, lastViewedAt: e.viewedAt, viewerRole: e.viewerRole ?? undefined });
    }
  }

  const byCompany: ProfileViewInsight[] = Array.from(byCompanyMap.entries())
    .map(([companyName, data]) => ({
      companyName,
      count: data.count,
      lastViewedAt: data.lastViewedAt,
      viewerRole: data.viewerRole,
    }))
    .sort((a, b) => b.count - a.count);

  return { totalViews, byCompany, canSeeCompanyNames };
}
