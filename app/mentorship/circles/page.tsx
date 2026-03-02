"use client";

/**
 * M-12: Mentorship Circles list.
 * Mentors see their circles; mentees see discoverable circles.
 */

import { useEffect, useState } from "react";
import Link from "next/link";

interface CircleItem {
  id: string;
  title: string;
  description?: string | null;
  maxMembers: number;
  feePaise: number;
  startDate: string;
  status?: string;
  memberCount?: number;
  mentorName?: string;
  mentorImage?: string | null;
  createdAt?: string;
}

export default function CirclesPage() {
  const [circles, setCircles] = useState<CircleItem[]>([]);
  const [loading, setLoading] = useState(true);

  const [asMentor, setAsMentor] = useState(false);

  useEffect(() => {
    fetch("/api/mentorship/circles")
      .then((r) => r.json())
      .then((data) => {
        if (data?.circles) {
          setCircles(data.circles);
          setAsMentor(!!data.asMentor);
        }
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="container mx-auto max-w-2xl py-8">
        <p className="text-muted-foreground">Loading circles...</p>
      </div>
    );
  }

  return (
    <div className="container mx-auto max-w-2xl py-8">
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-2xl font-semibold">Mentorship Circles</h1>
        {asMentor && (
          <Link
            href="/mentorship/circles/create"
            className="rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground"
          >
            Create Circle
          </Link>
        )}
      </div>
      <p className="mb-6 text-muted-foreground">
        Group cohorts: one circle = one mentor slot. Individual contracts and escrow per member.
      </p>
      {circles.length === 0 ? (
        <p className="text-muted-foreground">No circles yet.</p>
      ) : (
        <ul className="space-y-4">
          {circles.map((c) => (
            <li key={c.id}>
              <Link
                href={`/mentorship/circles/${c.id}`}
                className="block rounded-lg border p-4 transition hover:bg-muted/50"
              >
                <h2 className="font-medium">{c.title}</h2>
                {c.description && (
                  <p className="mt-1 line-clamp-2 text-sm text-muted-foreground">{c.description}</p>
                )}
                <div className="mt-2 flex items-center gap-4 text-sm text-muted-foreground">
                  <span>₹{(c.feePaise / 100).toLocaleString()}</span>
                  <span>{c.memberCount ?? 0}/{c.maxMembers} members</span>
                  {c.mentorName && <span>by {c.mentorName}</span>}
                </div>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
