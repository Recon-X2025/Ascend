"use client";

/**
 * M-12: Mentor circle management.
 */

import { useParams } from "next/navigation";
import { useEffect, useState } from "react";
import Link from "next/link";

interface Member {
  id: string;
  status: string;
  menteeId: string;
  menteeName?: string | null;
}

export default function ManageCirclePage() {
  const params = useParams();
  const circleId = params.circleId as string;
  const [members, setMembers] = useState<Member[]>([]);
  const [circle, setCircle] = useState<{ status: string } | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      fetch(`/api/mentorship/circles/${circleId}`).then((r) => r.json()),
      fetch(`/api/mentorship/circles/${circleId}/members`).then((r) => r.json()),
    ])
      .then(([circleData, membersData]) => {
        setCircle(circleData);
        setMembers(Array.isArray(membersData) ? membersData : []);
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
      <Link href={`/mentorship/circles/${circleId}`} className="text-sm text-muted-foreground hover:underline">
        ← Back to circle
      </Link>
      <h1 className="mt-4 text-2xl font-semibold">Manage Circle</h1>
      <p className="mt-2 text-sm text-muted-foreground">Status: {circle.status}</p>
      <div className="mt-6">
        <h2 className="font-medium">Members</h2>
        <ul className="mt-2 space-y-2">
          {members.map((m) => (
            <li key={m.id} className="flex items-center justify-between rounded border p-2">
              <span>{m.menteeName ?? "Unknown"}</span>
              <span className="text-sm text-muted-foreground">{m.status}</span>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
