"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { FollowMentorButton } from "@/components/mentorship/FollowMentorButton";
import { Button } from "@/components/ui/button";

type MentorItem = {
  mentorUserId: string;
  mentorName: string | null;
  mentorImage: string | null;
  followedAt: Date;
};

export function FollowingListClient({ initialList }: { initialList: MentorItem[] }) {
  const [list, setList] = useState(initialList);

  const handleUnfollow = (mentorUserId: string) => {
    setList((prev) => prev.filter((m) => m.mentorUserId !== mentorUserId));
  };

  if (list.length === 0) {
    return (
      <p className="text-muted-foreground">
        You don&apos;t follow any mentors yet.{" "}
        <Link href="/mentorship" className="text-primary hover:underline">
          Discover mentors
        </Link>{" "}
        and click Follow on their profiles.
      </p>
    );
  }

  return (
    <ul className="space-y-3">
      {list.map((m) => (
        <li
          key={m.mentorUserId}
          className="ascend-card p-4 flex items-center justify-between gap-4"
        >
          <Link href={`/mentors/${m.mentorUserId}`} className="flex items-center gap-3 hover:opacity-90">
            {m.mentorImage && (
              <Image
                src={m.mentorImage}
                alt=""
                width={40}
                height={40}
                className="h-10 w-10 rounded-full object-cover"
                unoptimized
              />
            )}
            <div>
              <p className="font-medium">{m.mentorName ?? "Mentor"}</p>
              <p className="text-xs text-muted-foreground">
                Following since {new Date(m.followedAt).toLocaleDateString()}
              </p>
            </div>
          </Link>
          <Button variant="ghost" size="sm" asChild>
            <Link href={`/mentors/${m.mentorUserId}`}>View profile</Link>
          </Button>
          <FollowMentorButton
            mentorUserId={m.mentorUserId}
            initialFollowing={true}
            onToggle={() => handleUnfollow(m.mentorUserId)}
          />
        </li>
      ))}
    </ul>
  );
}
