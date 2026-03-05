"use client";

import { useCallback, useRef, useState } from "react";
import Link from "next/link";
import { Share2, Copy, Download, Check } from "lucide-react";
import type { SuccessStoryData } from "@/lib/mentorship/success-stories";

interface SuccessStoryCardProps {
  story: SuccessStoryData;
  utmParams?: { utm_source?: string; utm_medium?: string };
}

export function SuccessStoryCard({ story, utmParams }: SuccessStoryCardProps) {
  const cardRef = useRef<HTMLDivElement>(null);
  const [copied, setCopied] = useState(false);

  const baseUrl = typeof window !== "undefined" ? window.location.origin : "";
  const params = new URLSearchParams();
  if (utmParams?.utm_source) params.set("utm_source", utmParams.utm_source);
  if (utmParams?.utm_medium) params.set("utm_medium", utmParams.utm_medium);
  const shareUrl = `${baseUrl}/stories/${story.slug}${params.toString() ? `?${params}` : ""}`;

  const copyLink = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(shareUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // ignore
    }
  }, [shareUrl]);

  const exportImage = useCallback(async () => {
    if (!cardRef.current) return;
    try {
      const { default: html2canvas } = await import("html2canvas");
      const canvas = await html2canvas(cardRef.current, {
        backgroundColor: "#F7F6F1",
        scale: 2,
      });
      const link = document.createElement("a");
      link.download = `ascend-success-${story.slug}.png`;
      link.href = canvas.toDataURL("image/png");
      link.click();
    } catch (e) {
      console.warn("Export image failed:", e);
    }
  }, [story.slug]);

  return (
    <div className="w-full max-w-md space-y-6">
      <div
        ref={cardRef}
        className="rounded-2xl border-2 border-[#0F1A0F]/10 bg-white p-8 shadow-lg"
      >
        <div className="flex items-center gap-2 mb-4">
          <span className="text-xs font-semibold tracking-wider text-green uppercase">
            Ascend
          </span>
          <span className="text-muted-foreground">·</span>
          <span className="text-xs text-muted-foreground">Success Story</span>
        </div>
        <h1 className="text-xl font-bold text-[#0F1A0F] leading-tight">
          {story.menteeFirstName} made the{" "}
          <span className="text-green">{story.transitionType}</span> transition
          {story.daysToComplete != null && (
            <span className="text-muted-foreground font-normal">
              {" "}
              in {story.daysToComplete} days
            </span>
          )}
          .
        </h1>
        <p className="mt-4 text-sm text-muted-foreground leading-relaxed">
          {story.claimedOutcome}
        </p>
        {story.employer && (
          <p className="mt-2 text-xs text-muted-foreground">
            Now at {story.employer}
          </p>
        )}
        {story.mentorFirstName && (
          <p className="mt-3 text-xs text-muted-foreground">
            Mentored by {story.mentorFirstName} on Ascend
          </p>
        )}
        <div className="mt-6 pt-4 border-t border-[#0F1A0F]/10">
          <Link
            href="/mentorship"
            className="text-sm font-medium text-green hover:underline"
          >
            Find your mentor →
          </Link>
        </div>
      </div>

      <div className="flex flex-wrap gap-3">
        <button
          type="button"
          onClick={copyLink}
          className="inline-flex items-center gap-2 rounded-lg border border-[#0F1A0F]/20 bg-white px-4 py-2 text-sm font-medium hover:bg-[#F7F6F1]"
        >
          {copied ? (
            <Check className="h-4 w-4 text-green" />
          ) : (
            <Copy className="h-4 w-4" />
          )}
          {copied ? "Copied" : "Copy link"}
        </button>
        <button
          type="button"
          onClick={exportImage}
          className="inline-flex items-center gap-2 rounded-lg border border-[#0F1A0F]/20 bg-white px-4 py-2 text-sm font-medium hover:bg-[#F7F6F1]"
        >
          <Download className="h-4 w-4" />
          Export image
        </button>
        <a
          href={`https://twitter.com/intent/tweet?text=${encodeURIComponent(`${story.menteeFirstName} made the ${story.transitionType} transition on Ascend. Find your mentor: ${shareUrl}`)}`}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-2 rounded-lg bg-[#0F1A0F] text-white px-4 py-2 text-sm font-medium hover:bg-[#0F1A0F]/90"
        >
          <Share2 className="h-4 w-4" />
          Share on X
        </a>
      </div>
    </div>
  );
}
