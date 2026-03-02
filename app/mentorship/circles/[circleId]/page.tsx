"use client";

/**
 * M-12: Circle detail page.
 */

import { useParams, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import Link from "next/link";

interface CircleDetail {
  id: string;
  title: string;
  description?: string | null;
  maxMembers: number;
  feePaise: number;
  startDate: string;
  status: string;
  mentorName?: string | null;
  mentorImage?: string | null;
  memberCount: number;
  members: Array<{ id: string; status: string; menteeName?: string | null }>;
  isMentor: boolean;
  isMember: boolean;
}

export default function CircleDetailPage() {
  const params = useParams();
  const router = useRouter();
  const circleId = params.circleId as string;
  const [circle, setCircle] = useState<CircleDetail | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch(`/api/mentorship/circles/${circleId}`)
      .then((r) => r.json())
      .then((data) => {
        setCircle(data);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, [circleId]);

  if (loading || !circle) {
    return (
      <div className="container mx-auto max-w-2xl py-8">
        <p className="text-muted-foreground">{loading ? "Loading..." : "Circle not found."}</p>
      </div>
    );
  }

  return (
    <div className="container mx-auto max-w-2xl py-8">
      <Link href="/mentorship/circles" className="text-sm text-muted-foreground hover:underline">
        ← Back to circles
      </Link>
      <h1 className="mt-4 text-2xl font-semibold">{circle.title}</h1>
      {circle.description && <p className="mt-2 text-muted-foreground">{circle.description}</p>}
      <div className="mt-4 flex gap-4 text-sm">
        <span>₹{(circle.feePaise / 100).toLocaleString()}</span>
        <span>{circle.memberCount}/{circle.maxMembers} members</span>
        {circle.mentorName && <span>Mentor: {circle.mentorName}</span>}
      </div>

      {circle.isMentor && (
        <Link
          href={`/mentorship/circles/${circleId}/manage`}
          className="mt-6 inline-block rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground"
        >
          Manage Circle
        </Link>
      )}

      {circle.status === "OPEN" && !circle.isMember && !circle.isMentor && (
        <button
          onClick={() => {
            fetch(`/api/mentorship/circles/${circleId}/apply`, {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({}),
            })
              .then((r) => r.json())
              .then(() => router.refresh())
              .catch(console.error);
          }}
          className="mt-6 rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground"
        >
          Apply to Join
        </button>
      )}
    </div>
  );
}
