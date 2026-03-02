"use client";

import Link from "next/link";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  Briefcase,
  Building2,
  UserPlus,
  TrendingUp,
  UserCheck,
  Sparkles,
} from "lucide-react";

interface Actor {
  id: string;
  name: string | null;
  image: string | null;
  headline: string | null;
  currentRole: string | null;
  username: string | null;
}

interface Company {
  id: string;
  slug: string;
  name: string;
}

interface JobPost {
  id: number;
  slug: string;
  title: string;
}

export type SignalType =
  | "ROLE_MOVE"
  | "NEW_JOB_AT_FOLLOW"
  | "NETWORK_JOIN"
  | "FIT_SCORE_IMPROVE"
  | "CONNECTION_HIRED"
  | "MENTOR_AVAILABLE";

interface SignalCardProps {
  id: string;
  type: SignalType;
  actor: Actor | null;
  company: Company | null;
  jobPost: JobPost | null;
  metadata: Record<string, unknown> | null;
  seen: boolean;
  createdAt: string;
}

export function SignalCard({
  type,
  actor,
  company,
  jobPost,
  metadata,
  createdAt,
}: SignalCardProps) {
  const actorName = actor?.name ?? "Someone";
  const actorUrl = actor?.username ? `/profile/${actor.username}` : null;
  const companyName = (metadata?.companyName as string) ?? company?.name ?? "Company";
  const jobTitle = (metadata?.jobTitle as string) ?? jobPost?.title;

  const time = new Date(createdAt).toLocaleDateString(undefined, {
    day: "numeric",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  });

  const content = (() => {
    switch (type) {
      case "ROLE_MOVE": {
        const fromRole = metadata?.fromRole as string | undefined;
        const toRole = (metadata?.toRole as string) ?? actor?.currentRole;
        const toCompany = (metadata?.toCompany as string) ?? "";
        return (
          <>
            <span className="font-medium">{actorName}</span> moved
            {fromRole && ` from ${fromRole}`}
            {toRole && ` to ${toRole}`}
            {toCompany && ` at ${toCompany}`}
          </>
        );
      }
      case "NEW_JOB_AT_FOLLOW":
        return (
          <>
            <span className="font-medium">{companyName}</span> posted new role
            {jobTitle && `: ${jobTitle}`}
          </>
        );
      case "NETWORK_JOIN":
        return (
          <>
            <span className="font-medium">{actorName}</span> joined your network
          </>
        );
      case "FIT_SCORE_IMPROVE":
        return (
          <>
            Your fit score improved for{" "}
            {jobPost ? (
              <Link href={`/jobs/${jobPost.slug}`} className="font-medium text-primary hover:underline">
                {jobTitle ?? jobPost.title}
              </Link>
            ) : (
              <span className="font-medium">{jobTitle ?? "a role"}</span>
            )}
          </>
        );
      case "CONNECTION_HIRED":
        return (
          <>
            <span className="font-medium">{actorName}</span> got hired
            {companyName && ` at ${companyName}`}
          </>
        );
      case "MENTOR_AVAILABLE":
        return (
          <>
            A mentor matching your goals is available
          </>
        );
      default:
        return <span>Career update</span>;
    }
  })();

  const icon = (() => {
    switch (type) {
      case "ROLE_MOVE":
        return <Briefcase className="h-4 w-4 text-muted-foreground shrink-0" />;
      case "NEW_JOB_AT_FOLLOW":
        return <Building2 className="h-4 w-4 text-muted-foreground shrink-0" />;
      case "NETWORK_JOIN":
        return <UserPlus className="h-4 w-4 text-muted-foreground shrink-0" />;
      case "FIT_SCORE_IMPROVE":
        return <TrendingUp className="h-4 w-4 text-muted-foreground shrink-0" />;
      case "CONNECTION_HIRED":
        return <UserCheck className="h-4 w-4 text-muted-foreground shrink-0" />;
      case "MENTOR_AVAILABLE":
        return <Sparkles className="h-4 w-4 text-muted-foreground shrink-0" />;
      default:
        return <Briefcase className="h-4 w-4 text-muted-foreground shrink-0" />;
    }
  })();

  const linkUrl = (() => {
    if (jobPost) return `/jobs/${jobPost.slug}`;
    if (company) return `/companies/${company.slug}`;
    if (actorUrl) return actorUrl;
    return null;
  })();

  const card = (
    <div className="ascend-card p-4 flex gap-3 hover:bg-muted/30 transition-colors">
      {actor && (
        <Avatar className="h-10 w-10 shrink-0">
          <AvatarImage src={actor.image ?? undefined} alt="" />
          <AvatarFallback className="bg-muted text-xs">
            {(actor.name ?? "?").slice(0, 2).toUpperCase()}
          </AvatarFallback>
        </Avatar>
      )}
      {!actor && <div className="w-10 shrink-0 flex items-center justify-center">{icon}</div>}
      <div className="min-w-0 flex-1 flex gap-2">
        <span className="shrink-0 mt-0.5">{icon}</span>
        <div>
          <p className="text-sm text-foreground">{content}</p>
          <p className="text-xs text-muted-foreground mt-1">{time}</p>
        </div>
      </div>
    </div>
  );

  if (linkUrl) {
    return <Link href={linkUrl} className="block">{card}</Link>;
  }
  return <div>{card}</div>;
}
