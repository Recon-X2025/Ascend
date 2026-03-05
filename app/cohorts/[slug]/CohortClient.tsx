"use client";

import { useState } from "react";
import useSWR from "swr";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import { Send, UserPlus } from "lucide-react";

const fetcher = (url: string) => fetch(url).then((r) => (r.ok ? r.json() : Promise.reject(new Error("Failed"))));

interface CohortClientProps {
  cohort: {
    id: string;
    name: string;
    slug: string;
    transitionPath: string;
    description: string | null;
    memberCount: number;
    threadCount: number;
  };
}

export function CohortClient({ cohort }: CohortClientProps) {
  const [content, setContent] = useState("");
  const [joining, setJoining] = useState(false);
  const [posting, setPosting] = useState(false);

  const { data: threadsData, mutate } = useSWR<{ success: boolean; data: Array<{ id: string; content: string; createdAt: string; authorName: string | null; authorImage: string | null }> }>(
    `/api/cohorts/${cohort.slug}/threads`,
    fetcher
  );
  const threads = threadsData?.data ?? [];

  const handleJoin = async () => {
    setJoining(true);
    try {
      const res = await fetch(`/api/cohorts/${cohort.slug}/join`, { method: "POST" });
      if (res.ok) mutate();
    } finally {
      setJoining(false);
    }
  };

  const handlePost = async () => {
    const trimmed = content.trim();
    if (!trimmed) return;
    setPosting(true);
    try {
      const res = await fetch(`/api/cohorts/${cohort.slug}/threads`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content: trimmed }),
      });
      if (res.ok) {
        setContent("");
        mutate();
      }
    } finally {
      setPosting(false);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-[#0F1A0F]">{cohort.name}</h1>
        <p className="text-sm text-muted-foreground mt-1">
          {cohort.transitionPath} · {cohort.memberCount} members
        </p>
        {cohort.description && (
          <p className="text-sm text-ink-3 mt-2">{cohort.description}</p>
        )}
        <Button
          className="mt-4 gap-2"
          onClick={handleJoin}
          disabled={joining}
        >
          <UserPlus className="h-4 w-4" />
          {joining ? "Joining…" : "Join cohort"}
        </Button>
      </div>

      <div className="rounded-xl border border-[var(--border)] bg-white p-4">
        <h2 className="font-semibold text-ink mb-3">Discussion</h2>
        <div className="flex gap-2 mb-4">
          <textarea
            placeholder="Share a tip or ask a question…"
            value={content}
            onChange={(e) => setContent(e.target.value.slice(0, 2000))}
            className="flex-1 min-h-[80px] rounded border border-[var(--border)] px-3 py-2 text-sm"
          />
          <Button size="sm" onClick={handlePost} disabled={posting || !content.trim()} className="gap-1">
            <Send className="h-4 w-4" />
            Post
          </Button>
        </div>
        <div className="space-y-3">
          {threads.map((t) => (
            <div key={t.id} className="border-b border-[var(--border)] pb-3 last:border-0">
              <div className="flex items-start gap-2">
                {t.authorImage && (
                  <Image src={t.authorImage} alt="" width={32} height={32} className="rounded-full" unoptimized />
                )}
                <div>
                  <p className="text-xs font-medium text-muted-foreground">{t.authorName ?? "Anonymous"}</p>
                  <p className="text-sm text-ink mt-0.5 whitespace-pre-wrap">{t.content}</p>
                  <p className="text-xs text-muted-foreground mt-1">
                    {new Date(t.createdAt).toLocaleDateString()}
                  </p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
