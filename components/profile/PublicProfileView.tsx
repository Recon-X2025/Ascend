"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { ConnectionRequestButton } from "@/components/network/ConnectionRequestButton";
import { ShareButton } from "@/components/growth/ShareButton";
import { EndorseSkillButton } from "@/components/growth/EndorseSkillButton";

interface PublicProfileViewProps {
  profile: {
    id: string;
    userId?: string;
    username: string | null;
    headline: string | null;
    summary: string | null;
    avatarUrl: string | null;
    bannerUrl: string | null;
    city: string | null;
    state: string | null;
    country: string | null;
    visibility: string;
    openToWork: boolean;
    openToWorkVisibility: string;
    user: { name: string | null; image: string | null } | null;
    experiences?: unknown[];
    educations?: unknown[];
    skills?: { skill: { name: string }; endorseCount: number }[];
    certifications?: unknown[];
    projects?: unknown[];
    awards?: unknown[];
    languages?: unknown[];
    volunteerWork?: unknown[];
    publications?: unknown[];
  };
  isOwner: boolean;
  hasMentorshipCheckInBadge?: boolean;
  endorsementCountBySkill?: Record<string, number>;
  endorsedByMe?: string[];
  isConnected?: boolean;
  profileUserId?: string;
  profileBadges?: { provider: string; skill: string; score: number | null; percentile: number | null; badgeUrl: string | null; verificationUrl: string | null; expiresAt: string | null; status: string }[];
}

export function PublicProfileView({
  profile,
  isOwner,
  hasMentorshipCheckInBadge,
  endorsementCountBySkill = {},
  endorsedByMe = [],
  isConnected = false,
  profileUserId,
  profileBadges = [],
}: PublicProfileViewProps) {
  const name = profile.user?.name ?? "User";
  const initials = name.split(" ").map((n) => n[0]).join("").toUpperCase().slice(0, 2);
  const avatarSrc = profile.avatarUrl ? `/api/files/${profile.avatarUrl}` : profile.user?.image ?? undefined;
  const location = [profile.city, profile.state, profile.country].filter(Boolean).join(", ");
  const isPrivate = profile.visibility === "PRIVATE";
  const restricted = profile.visibility === "CONNECTIONS_ONLY" || profile.visibility === "RECRUITERS_ONLY";

  const [endorsementCountBySkillState, setEndorsementCountBySkillState] = useState<Record<string, number>>(endorsementCountBySkill);
  const [endorsedByMeState, setEndorsedByMeState] = useState<string[]>(endorsedByMe);
  const handleEndorseSuccess = useMemo(
    () => (skill: string) => {
      setEndorsementCountBySkillState((prev) => ({ ...prev, [skill]: (prev[skill] ?? 0) + 1 }));
      setEndorsedByMeState((prev) => (prev.includes(skill) ? prev : [...prev, skill]));
    },
    []
  );

  if (isPrivate && !isOwner) {
    return (
      <div className="page-container page-section flex flex-col items-center justify-center min-h-[50vh]">
        <p className="text-text-secondary">This profile is private.</p>
      </div>
    );
  }

  if (restricted && !isOwner) {
    return (
      <div className="page-container page-section">
        <div className="ascend-card p-8 max-w-xl mx-auto text-center">
          <Avatar className="h-20 w-20 mx-auto">
            <AvatarImage src={avatarSrc} alt="" />
            <AvatarFallback className="bg-accent-green/20 text-accent-green text-2xl">{initials}</AvatarFallback>
          </Avatar>
          <h1 className="mt-4 text-xl font-semibold text-text-primary">{name}</h1>
          {profile.headline && <p className="text-text-secondary">{profile.headline}</p>}
          {location && <p className="text-sm text-text-secondary mt-1">{location}</p>}
          <p className="mt-6 text-text-secondary">
            This profile is only visible to {profile.visibility === "RECRUITERS_ONLY" ? "recruiters" : "connections"}.
          </p>
        </div>
      </div>
    );
  }

  const experiences = (profile.experiences ?? []) as { company: string; designation: string; startYear: number; endYear: number | null; isCurrent: boolean }[];
  const educations = (profile.educations ?? []) as { institution: string; degree: string | null }[];
  const skills = (profile.skills ?? []) as { skill: { name: string }; endorseCount: number }[];

  return (
    <div className="page-container page-section">
      {/* Banner */}
      <div className="relative w-full h-[200px] bg-primary rounded-t-xl overflow-hidden -mx-4 sm:mx-0">
        {profile.bannerUrl && (
          <Image
            src={`/api/files/${profile.bannerUrl}`}
            alt=""
            fill
            className="object-cover"
            unoptimized
            sizes="100vw"
          />
        )}
        <div className="absolute bottom-0 left-4 sm:left-8 transform translate-y-1/2">
          <Avatar className="h-24 w-24 border-4 border-white">
            <AvatarImage src={avatarSrc} alt="" />
            <AvatarFallback className="bg-accent-green/20 text-accent-green text-2xl">{initials}</AvatarFallback>
          </Avatar>
          {profile.openToWork && (
            <span className="absolute bottom-0 right-0 h-6 w-6 rounded-full border-2 border-white bg-accent-green" title="Open to work" />
          )}
        </div>
      </div>
      <div className="ascend-card rounded-t-none p-6 pt-16 sm:pt-16">
        <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-semibold text-text-primary">{name}</h1>
            {profile.headline && <p className="text-text-secondary">{profile.headline}</p>}
            {location && <p className="text-sm text-text-secondary mt-1">{location}</p>}
            <div className="flex flex-wrap items-center gap-2 mt-2">
              {profile.openToWork && (
                <span className="inline-block px-2 py-0.5 rounded bg-accent-green/10 text-accent-green text-sm font-medium">
                  Open to work
                </span>
              )}
              {hasMentorshipCheckInBadge && (
                <span
                  className="inline-block px-2 py-0.5 rounded bg-accent-green/10 text-accent-green text-sm font-medium"
                  title="This person completed a 6-month outcome check-in confirming their career transition."
                >
                  6-Month Check-In Verified
                </span>
              )}
            </div>
          </div>
          <div className="flex items-center gap-2">
            {profile.username && (
              <ShareButton
                entityType="PROFILE"
                entityId={profile.username}
                url={`/profile/${profile.username}`}
                title={profile.user?.name ?? "Profile"}
              />
            )}
            {isOwner ? (
              <Link href="/profile/edit">
                <Button className="btn-secondary">Edit profile</Button>
              </Link>
            ) : (
              profile.userId && (
                <ConnectionRequestButton userId={profile.userId} />
              )
            )}
          </div>
        </div>

        {profile.summary && (
          <div className="mt-6">
            <h2 className="section-title">About</h2>
            <p className="text-text-secondary whitespace-pre-wrap mt-1">{profile.summary}</p>
          </div>
        )}

        {experiences.length > 0 && (
          <div className="mt-8">
            <h2 className="section-title">Experience</h2>
            <ul className="mt-2 space-y-4">
              {experiences.slice(0, 10).map((exp, i) => (
                <li key={i}>
                  <p className="font-medium text-text-primary">{exp.designation} at {exp.company}</p>
                  <p className="text-sm text-text-secondary">
                    {exp.startYear} – {exp.isCurrent ? "Present" : exp.endYear}
                  </p>
                </li>
              ))}
            </ul>
          </div>
        )}

        {educations.length > 0 && (
          <div className="mt-8">
            <h2 className="section-title">Education</h2>
            <ul className="mt-2 space-y-2">
              {educations.map((ed, i) => (
                <li key={i}>
                  <p className="font-medium text-text-primary">{ed.institution}</p>
                  {ed.degree && <p className="text-sm text-text-secondary">{ed.degree}</p>}
                </li>
              ))}
            </ul>
          </div>
        )}

        {skills.length > 0 && (
          <div className="mt-8" id="skills">
            <h2 className="section-title">Skills</h2>
            <div className="mt-2 flex flex-wrap gap-2 items-center">
              {skills.map((s, i) => {
                const phase19Count = endorsementCountBySkillState[s.skill.name] ?? 0;
                const totalCount = phase19Count || s.endorseCount;
                const alreadyEndorsed = endorsedByMeState.includes(s.skill.name);
                const canEndorse = !isOwner && isConnected && profileUserId;
                return (
                  <span key={i} className="inline-flex items-center gap-1.5">
                    <span className="badge badge-featured">
                      {s.skill.name}
                      {totalCount > 0 && (
                        <span className="ml-1 text-text-secondary">({totalCount} endorsement{totalCount !== 1 ? "s" : ""})</span>
                      )}
                    </span>
                    {canEndorse && (
                      <EndorseSkillButton
                        recipientId={profileUserId}
                        skill={s.skill.name}
                        alreadyEndorsed={alreadyEndorsed}
                        onSuccess={() => handleEndorseSuccess(s.skill.name)}
                      />
                    )}
                  </span>
                );
              })}
            </div>
          </div>
        )}

        {profileBadges.length > 0 && (
          <div className="mt-8">
            <h2 className="section-title">Certifications</h2>
            <div className="mt-2 flex flex-wrap gap-2">
              {profileBadges.map((b, i) => (
                <span key={i} className="inline-flex items-center gap-1.5 px-2 py-1 rounded bg-muted text-sm">
                  <span className="font-medium">{b.provider}</span>
                  <span className="text-muted-foreground">· {b.skill}</span>
                  {b.score != null && <span className="text-muted-foreground">({b.score})</span>}
                  {b.verificationUrl && (
                    <a href={b.verificationUrl} target="_blank" rel="noreferrer" className="text-primary text-xs">Verify</a>
                  )}
                  {b.expiresAt && new Date(b.expiresAt) < new Date() && (
                    <span className="text-xs text-muted-foreground">Expired</span>
                  )}
                </span>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
