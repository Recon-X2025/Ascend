"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";
import { MENTOR_COMPANY_TYPE_LABELS, M2_FOCUS_AREA_LABELS } from "@/lib/mentorship/m2-labels";
import type { MentorProfile, AvailabilityWindow } from "@prisma/client";

type Profile = MentorProfile & {
  availabilityWindows: AvailabilityWindow[];
  user?: { name: string | null };
};

interface MentorProfileCardProps {
  profile: Profile;
}

export function MentorProfileCard({ profile }: MentorProfileCardProps) {
  const from = profile.fromRole
    ? `${profile.fromRole} · ${profile.fromCompanyType ? MENTOR_COMPANY_TYPE_LABELS[profile.fromCompanyType] : ""} · ${profile.fromIndustry ?? ""} · ${profile.fromCity ?? ""}`
    : null;
  const to = profile.toRole
    ? `${profile.toRole} · ${profile.toCompanyType ? MENTOR_COMPANY_TYPE_LABELS[profile.toCompanyType] : ""} · ${profile.toIndustry ?? ""} · ${profile.toCity ?? ""}`
    : null;
  const focusLabels = (profile.m2FocusAreas ?? []).map((f) => M2_FOCUS_AREA_LABELS[f] ?? f);
  const availabilitySummary =
    profile.availabilityWindows?.length > 0
      ? `${profile.availabilityWindows.length} window(s)`
      : "—";

  return (
    <div className="rounded-xl border border-[var(--border)] bg-[var(--surface)] p-6 mb-6">
      <div className="flex justify-between items-start">
        <div>
          <h2 className="font-semibold text-ink">Your mentor profile</h2>
          {from && to && (
            <p className="text-sm text-ink-3 mt-1">
              {from} → {to}
            </p>
          )}
          {profile.transitionYear && (
            <p className="text-xs text-ink-4 mt-1">Completed {profile.transitionYear}</p>
          )}
          {focusLabels.length > 0 && (
            <div className="flex flex-wrap gap-1 mt-2">
              {focusLabels.map((l) => (
                <span
                  key={l}
                  className="inline-flex rounded-full border border-[var(--border)] px-2 py-0.5 text-xs"
                >
                  {l}
                </span>
              ))}
            </div>
          )}
        </div>
        <span
          className={`text-xs font-medium px-2 py-1 rounded ${
            profile.transitionBadge === "PLATFORM_VERIFIED"
              ? "bg-green/10 text-green border border-green/30"
              : "bg-muted text-muted-foreground border border-border"
          }`}
        >
          {profile.transitionBadge === "PLATFORM_VERIFIED" ? "Verified by Ascend" : "Self-reported"}
        </span>
      </div>
      <p className="text-sm text-ink-3 mt-2">
        {profile.isPublic
          ? "Your profile is live in matching"
          : "Your profile is not yet discoverable"}
      </p>
      <p className="text-xs text-ink-4 mt-1">Availability: {availabilitySummary}</p>
      <Link href="/mentorship/become-a-mentor" className="inline-block mt-4">
        <Button variant="outline" size="sm">Edit profile</Button>
      </Link>
    </div>
  );
}
