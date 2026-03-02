"use client";

import useSWR from "swr";
import Link from "next/link";
import { ApplicationCard } from "@/components/mentorship/ApplicationCard";

const fetcher = (url: string) => fetch(url).then((r) => r.json());

export function ApplicationsListClient() {
  const { data: applications, mutate } = useSWR("/api/mentorship/applications", fetcher);

  const handleWithdraw = async (id: string) => {
    const res = await fetch(`/api/mentorship/applications/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "WITHDRAW" }),
    });
    if (!res.ok) throw new Error("Failed to withdraw");
    await mutate();
  };

  const handleAnswerSubmit = async (id: string, answer: string) => {
    const res = await fetch(`/api/mentorship/applications/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "ANSWER", answer }),
    });
    if (!res.ok) throw new Error("Failed to submit answer");
    await mutate();
  };

  if (applications === undefined) {
    return (
      <div className="min-h-screen bg-[#F7F6F1] flex items-center justify-center">
        <div className="animate-pulse text-muted-foreground">Loading…</div>
      </div>
    );
  }

  const list = Array.isArray(applications) ? applications : [];

  return (
    <div className="min-h-screen bg-[#F7F6F1]">
      <div className="max-w-2xl mx-auto px-4 py-8">
        <h1 className="text-2xl font-bold text-[#0F1A0F]">My applications</h1>
        <p className="text-muted-foreground mt-1 mb-8">
          Track your mentorship applications and respond to mentor questions.
        </p>

        {list.length === 0 ? (
          <div className="ascend-card p-8 text-center">
            <p className="text-muted-foreground">You haven&apos;t submitted any applications yet.</p>
            <Link
              href="/mentorship"
              className="mt-4 inline-block text-green font-medium hover:underline"
            >
              View your matches →
            </Link>
          </div>
        ) : (
          <div className="space-y-6">
            {list.map((app: Record<string, unknown>) => (
              <ApplicationCard
                key={String(app.id)}
                application={app as Parameters<typeof ApplicationCard>[0]["application"]}
                onWithdraw={handleWithdraw}
                onAnswerSubmit={handleAnswerSubmit}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
