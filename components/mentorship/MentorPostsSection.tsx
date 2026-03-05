"use client";

import useSWR from "swr";
import { MentorPostCard, type MentorPostItem } from "./MentorPostCard";

const fetcher = (url: string) =>
  fetch(url).then((r) => (r.ok ? r.json() : Promise.reject(new Error("Failed"))));

interface MentorPostsSectionProps {
  mentorUserId: string;
}

export function MentorPostsSection({ mentorUserId }: MentorPostsSectionProps) {
  const { data, error } = useSWR<{ success: boolean; data: MentorPostItem[] }>(
    `/api/mentorship/posts/mentor/${mentorUserId}`,
    fetcher
  );

  const posts = data?.data ?? [];
  if (error || posts.length === 0) return null;

  return (
    <section>
      <h2 className="font-semibold text-ink mb-3">Recent posts</h2>
      <div className="space-y-4">
        {posts.map((post) => (
          <MentorPostCard
            key={post.id}
            post={{
              ...post,
              createdAt: typeof post.createdAt === "string" ? post.createdAt : new Date(post.createdAt).toISOString(),
            }}
            showMentorLink={false}
          />
        ))}
      </div>
    </section>
  );
}
