"use client";

import useSWR from "swr";
import { MentorPostCard, type MentorPostItem } from "@/components/mentorship/MentorPostCard";
import { PostCompose } from "@/components/mentorship/PostCompose";
import Link from "next/link";

const fetcher = (url: string) =>
  fetch(url).then((r) => (r.ok ? r.json() : Promise.reject(new Error("Failed"))));

interface FeedClientProps {
  initialPosts: MentorPostItem[];
  isMentor: boolean;
}

export function FeedClient({ initialPosts, isMentor }: FeedClientProps) {
  const { data, mutate } = useSWR<{ success: boolean; data: MentorPostItem[] }>(
    "/api/mentorship/posts/feed",
    fetcher,
    { fallbackData: { success: true, data: initialPosts } }
  );

  const posts = data?.data ?? [];

  return (
    <div className="space-y-6">
      {isMentor && (
        <div className="mb-6">
          <PostCompose onSuccess={() => mutate()} />
        </div>
      )}
      {posts.length === 0 ? (
        <div className="rounded-xl border border-[var(--border)] bg-[var(--surface)] p-8 text-center">
          <p className="text-muted-foreground">
            No posts yet. Follow mentors to see their insights in your feed.
          </p>
          <Link
            href="/mentorship"
            className="mt-4 inline-block text-green font-medium hover:underline"
          >
            Discover mentors →
          </Link>
        </div>
      ) : (
        posts.map((post) => (
          <MentorPostCard
            key={post.id}
            post={{
              ...post,
              createdAt: typeof post.createdAt === "string" ? post.createdAt : new Date(post.createdAt).toISOString(),
            }}
          />
        ))
      )}
    </div>
  );
}
