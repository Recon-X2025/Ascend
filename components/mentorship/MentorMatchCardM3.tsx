"use client";

import Image from "next/image";
import Link from "next/link";
import { Check } from "lucide-react";
import { M2_FOCUS_AREA_LABELS } from "@/lib/mentorship/m2-labels";
import { SESSION_FREQUENCY_LABELS } from "@/lib/mentorship/m2-labels";

export type Match = {
  mentorProfileId: string;
  mentorUserId: string;
  mentorName: string | null;
  mentorImage: string | null;
  matchReason: string;
  profile: {
    fromRole: string | null;
    fromCompanyType: string | null;
    toRole: string | null;
    toCompanyType: string | null;
    transitionDurationMonths: number | null;
    transitionYear: number | null;
    toCity: string | null;
    m2FocusAreas: string[];
    sessionFrequency: string | null;
    maxActiveMentees: number;
    currentMenteeCount: number;
    availabilityWindows?: unknown[];
  };
};

export function MentorMatchCardM3({ match }: { match: Match }) {
  const firstName = match.mentorName?.split(" ")[0] ?? "Mentor";
  const from = [match.profile.fromRole, match.profile.fromCompanyType].filter(Boolean).join(" at ");
  const to = [match.profile.toRole, match.profile.toCompanyType].filter(Boolean).join(" at ");
  const transitionText = from && to ? `${from} → ${to}` : null;
  const duration =
    match.profile.transitionDurationMonths != null
      ? `${match.profile.transitionDurationMonths} months`
      : "";
  const year = match.profile.transitionYear != null ? `${match.profile.transitionYear}` : "";
  const when = duration || year ? `Made in ${duration || year}` : "";
  const capacitySlots = Math.max(
    0,
    (match.profile.maxActiveMentees ?? 2) - (match.profile.currentMenteeCount ?? 0)
  );
  const freq = match.profile.sessionFrequency
    ? SESSION_FREQUENCY_LABELS[match.profile.sessionFrequency as keyof typeof SESSION_FREQUENCY_LABELS]
    : null;

  return (
    <div className="ascend-card p-6 border border-border hover:border-green/30 transition-colors">
      <div className="flex gap-4">
        <div className="w-14 h-14 rounded-full bg-green/20 flex items-center justify-center font-display font-bold text-green shrink-0">
          {match.mentorImage ? (
            <Image
              src={match.mentorImage}
              alt=""
              width={56}
              height={56}
              className="w-full h-full rounded-full object-cover"
              unoptimized
            />
          ) : (
            (match.mentorName?.slice(0, 1) ?? "?").toUpperCase()
          )}
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <h3 className="font-display font-semibold text-ink">{match.mentorName ?? "Mentor"}</h3>
            <span className="text-green" title="Verified">
              <Check className="h-5 w-5" />
            </span>
          </div>
          {transitionText && (
            <p className="text-sm text-muted-foreground mt-0.5">{transitionText}</p>
          )}
          {when && (
            <p className="text-xs text-muted-foreground mt-0.5">
              {when}
              {match.profile.toCity ? ` · ${match.profile.toCity}` : ""}
            </p>
          )}
          <p className="mt-3 text-sm italic text-ink/90">{match.matchReason}</p>
          <div className="flex flex-wrap gap-1 mt-2">
            {(match.profile.m2FocusAreas ?? []).slice(0, 3).map((f) => (
              <span
                key={f}
                className="inline-block px-2 py-0.5 rounded border border-border text-xs text-muted-foreground"
              >
                {M2_FOCUS_AREA_LABELS[f as keyof typeof M2_FOCUS_AREA_LABELS] ?? f}
              </span>
            ))}
          </div>
          <div className="flex flex-wrap gap-2 mt-2 text-xs text-muted-foreground">
            {freq && <span>Available {freq.toLowerCase()}</span>}
            <span>{capacitySlots} of {match.profile.maxActiveMentees ?? 2} slots available</span>
          </div>
          <Link
            href={`/mentorship/apply/${match.mentorUserId}`}
            className="mt-4 inline-block font-body font-semibold text-sm text-green hover:underline"
          >
            Apply to {firstName} →
          </Link>
        </div>
      </div>
    </div>
  );
}
