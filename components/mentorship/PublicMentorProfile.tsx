"use client";

import Image from "next/image";
import type { MentorProfile, User, AvailabilityWindow } from "@prisma/client";
import { FollowMentorButton } from "./FollowMentorButton";
import { MentorPostsSection } from "./MentorPostsSection";

type Profile = MentorProfile & {
  user: Pick<User, "id" | "name" | "image"> | null;
  availabilityWindows: AvailabilityWindow[];
};

interface PublicMentorProfileProps {
  profile: Profile;
  mentorUserId?: string;
  isFollowing?: boolean;
  followerCount?: number;
  showFollowButton?: boolean;
  labels: {
    companyType: Record<string, string>;
    focusArea: Record<string, string>;
    engagement: Record<string, string>;
    frequency: Record<string, string>;
    geography: Record<string, string>;
    dayOfWeek: Record<string, string>;
  };
}

export function PublicMentorProfile({
  profile,
  mentorUserId,
  isFollowing = false,
  followerCount = 0,
  showFollowButton = false,
  labels,
}: PublicMentorProfileProps) {
  const fromBlock =
    profile.fromRole &&
    `${profile.fromRole} · ${profile.fromCompanyType ? labels.companyType[profile.fromCompanyType] : ""} · ${profile.fromIndustry ?? ""} · ${profile.fromCity ?? ""}`;
  const toBlock =
    profile.toRole &&
    `${profile.toRole} · ${profile.toCompanyType ? labels.companyType[profile.toCompanyType] : ""} · ${profile.toIndustry ?? ""} · ${profile.toCity ?? ""}`;
  const focusPills = (profile.m2FocusAreas ?? []).map((f) => labels.focusArea[f] ?? f);
  const engagementText = (profile.engagementPreference ?? [])
    .map((e) => labels.engagement[e])
    .join(", ");
  const frequencyText = profile.sessionFrequency ? labels.frequency[profile.sessionFrequency] : "";
  const availabilityDays = Array.from(new Set((profile.availabilityWindows ?? []).map((w) => labels.dayOfWeek[w.dayOfWeek]))).join(", ");
  const geographyText = profile.geographyScope ? labels.geography[profile.geographyScope] : "";

  return (
    <div className="space-y-8">
      <header className="flex items-center justify-between gap-4 flex-wrap">
        <div className="flex items-center gap-4">
          {profile.user?.image && (
            <Image
              src={profile.user.image}
              alt=""
              width={64}
              height={64}
              className="h-16 w-16 rounded-full object-cover"
              unoptimized
            />
          )}
          <div>
            <h1 className="text-2xl font-bold text-[#0F1A0F]">{profile.user?.name ?? "Mentor"}</h1>
            <span className="inline-flex items-center gap-1 rounded border border-green/30 bg-green/10 px-2 py-0.5 text-xs font-medium text-green">
              ✓ Verified
            </span>
            {followerCount > 0 && (
              <p className="text-xs text-muted-foreground mt-1">{followerCount} follower{followerCount !== 1 ? "s" : ""}</p>
            )}
          </div>
        </div>
        {showFollowButton && mentorUserId && (
          <FollowMentorButton mentorUserId={mentorUserId} initialFollowing={isFollowing} />
        )}
      </header>

      <section className="rounded-xl border border-[var(--border)] bg-[var(--surface)] p-6">
        <h2 className="font-semibold text-ink mb-3">Transition</h2>
        <div className="flex flex-wrap items-center gap-2">
          {fromBlock && (
            <span className="rounded border border-[var(--border)] bg-muted/30 px-3 py-1.5 text-sm">
              {fromBlock}
            </span>
          )}
          <span className="text-ink-4">→</span>
          {toBlock && (
            <span className="rounded border border-[var(--border)] bg-muted/30 px-3 py-1.5 text-sm">
              {toBlock}
            </span>
          )}
        </div>
        <div className="flex flex-wrap gap-2 mt-2">
          {profile.transitionDurationMonths != null && (
            <span className="text-xs text-ink-4">Made in {profile.transitionDurationMonths} months</span>
          )}
          {profile.transitionYear != null && (
            <span className="text-xs text-ink-4">Completed {profile.transitionYear}</span>
          )}
          <span
            className={`text-xs font-medium px-2 py-0.5 rounded ${
              profile.transitionBadge === "PLATFORM_VERIFIED"
                ? "bg-green/10 text-green border border-green/30"
                : "bg-muted text-muted-foreground border border-border"
            }`}
          >
            {profile.transitionBadge === "PLATFORM_VERIFIED" ? "Verified by Ascend" : "Self-reported"}
          </span>
        </div>
      </section>

      {(profile.keyFactor1 || profile.keyFactor2 || profile.keyFactor3) && (
        <section className="rounded-xl border border-[var(--border)] bg-[var(--surface)] p-6">
          <h2 className="font-semibold text-ink mb-3">Key factors</h2>
          <div className="space-y-2">
            {profile.keyFactor1 && <p className="text-sm text-ink-3">{profile.keyFactor1}</p>}
            {profile.keyFactor2 && <p className="text-sm text-ink-3">{profile.keyFactor2}</p>}
            {profile.keyFactor3 && <p className="text-sm text-ink-3">{profile.keyFactor3}</p>}
          </div>
        </section>
      )}

      <section className="rounded-xl border border-[var(--border)] bg-[var(--surface)] p-6 space-y-4">
        <h2 className="font-semibold text-ink">Mentor statement</h2>
        {profile.statementTransitionMade && (
          <div>
            <h3 className="text-sm font-medium text-ink-3">The transition I made...</h3>
            <p className="text-sm text-ink mt-1">{profile.statementTransitionMade}</p>
          </div>
        )}
        {profile.statementWishIKnew && (
          <div>
            <h3 className="text-sm font-medium text-ink-3">What I wish I had known...</h3>
            <p className="text-sm text-ink mt-1">{profile.statementWishIKnew}</p>
          </div>
        )}
        {profile.statementCanHelpWith && (
          <div>
            <h3 className="text-sm font-medium text-ink-3">What I can help you with...</h3>
            <p className="text-sm text-ink mt-1">{profile.statementCanHelpWith}</p>
          </div>
        )}
        {profile.statementCannotHelpWith && (
          <div>
            <h3 className="text-sm font-medium text-ink-3">What I cannot help you with...</h3>
            <p className="text-sm text-ink mt-1">{profile.statementCannotHelpWith}</p>
          </div>
        )}
      </section>

      {mentorUserId && (
        <div className="mt-8">
          <MentorPostsSection mentorUserId={mentorUserId} />
        </div>
      )}

      {focusPills.length > 0 && (
        <section>
          <h2 className="font-semibold text-ink mb-2">Focus areas</h2>
          <div className="flex flex-wrap gap-2">
            {focusPills.map((l) => (
              <span
                key={l}
                className="inline-flex rounded-full border border-[var(--border)] px-3 py-1 text-sm"
              >
                {l}
              </span>
            ))}
          </div>
        </section>
      )}

      <section className="text-sm text-ink-3">
        {geographyText && <p>Geography: {geographyText}</p>}
        {(profile.languages?.length ?? 0) > 0 && (
          <p className="mt-1">Languages: {profile.languages!.join(", ")}</p>
        )}
        <p className="mt-1">
          Available {availabilityDays || "—"} · {frequencyText || "—"} · {engagementText || "—"}
        </p>
        <p className="mt-1">
          {Math.max(0, profile.maxActiveMentees - profile.currentMenteeCount)} of {profile.maxActiveMentees} mentee
          slots available
        </p>
      </section>
    </div>
  );
}
