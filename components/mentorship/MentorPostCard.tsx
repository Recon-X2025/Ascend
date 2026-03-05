"use client";

import Image from "next/image";
import Link from "next/link";

export type MentorPostItem = {
  id: string;
  mentorUserId: string;
  mentorName: string | null;
  mentorImage: string | null;
  content: string;
  imageUrl: string | null;
  createdAt: string;
};

interface MentorPostCardProps {
  post: MentorPostItem;
  showMentorLink?: boolean;
}

export function MentorPostCard({ post, showMentorLink = true }: MentorPostCardProps) {
  const date = new Date(post.createdAt).toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
    year: "numeric",
  });

  return (
    <article className="rounded-xl border border-[var(--border)] bg-[var(--surface)] p-4">
      <div className="flex items-start gap-3">
        {post.mentorImage && (
          <Image
            src={post.mentorImage}
            alt=""
            width={40}
            height={40}
            className="h-10 w-10 rounded-full object-cover flex-shrink-0"
            unoptimized
          />
        )}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            {showMentorLink ? (
              <Link
                href={`/mentors/${post.mentorUserId}`}
                className="font-medium text-ink hover:underline"
              >
                {post.mentorName ?? "Mentor"}
              </Link>
            ) : (
              <span className="font-medium text-ink">{post.mentorName ?? "Mentor"}</span>
            )}
            <span className="text-xs text-muted-foreground">{date}</span>
          </div>
          <p className="text-sm text-ink-3 mt-1 whitespace-pre-wrap">{post.content}</p>
          {post.imageUrl && (
            <a
              href={post.imageUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="block mt-2"
            >
              <img
                src={post.imageUrl}
                alt=""
                className="max-w-full max-h-64 rounded-lg object-cover"
              />
            </a>
          )}
        </div>
      </div>
    </article>
  );
}
