"use client";

import { useCallback, useRef, useState } from "react";
import Link from "next/link";
import { Copy, Download, Share2, Check } from "lucide-react";
import type { MilestoneCardData } from "@/lib/milestones/career";

interface MilestoneCardProps {
  data: MilestoneCardData;
  utmParams?: { utm_source?: string; utm_medium?: string };
}

export function MilestoneCard({ data, utmParams }: MilestoneCardProps) {
  const cardRef = useRef<HTMLDivElement>(null);
  const [copied, setCopied] = useState(false);

  const baseUrl = typeof window !== "undefined" ? window.location.origin : "";
  const params = new URLSearchParams();
  if (utmParams?.utm_source) params.set("utm_source", utmParams.utm_source);
  if (utmParams?.utm_medium) params.set("utm_medium", utmParams.utm_medium);
  const shareUrl = `${baseUrl}/milestones/${data.slug}${params.toString() ? `?${params}` : ""}`;

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
      link.download = `ascend-milestone-${data.slug}.png`;
      link.href = canvas.toDataURL("image/png");
      link.click();
    } catch (e) {
      console.warn("Export failed:", e);
    }
  }, [data.slug]);

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
          <span className="text-xs text-muted-foreground">Career Milestone</span>
        </div>
        <h1 className="text-xl font-bold text-[#0F1A0F] leading-tight">
          {data.headline}
        </h1>
        {data.subline && (
          <p className="mt-2 text-sm text-muted-foreground">{data.subline}</p>
        )}
        <div className="mt-6 pt-4 border-t border-[#0F1A0F]/10">
          <Link
            href="/mentorship"
            className="text-sm font-medium text-green hover:underline"
          >
            {data.type === "CONTRACT_COMPLETED" ? "Find your mentor →" : "Become a mentor →"}
          </Link>
        </div>
      </div>

      <div className="flex flex-wrap gap-3">
        <button
          type="button"
          onClick={copyLink}
          className="inline-flex items-center gap-2 rounded-lg border border-[#0F1A0F]/20 bg-white px-4 py-2 text-sm font-medium hover:bg-[#F7F6F1]"
        >
          {copied ? <Check className="h-4 w-4 text-green" /> : <Copy className="h-4 w-4" />}
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
          href={`https://twitter.com/intent/tweet?text=${encodeURIComponent(`${data.headline} ${data.subline ?? ""} — ${shareUrl}`)}`}
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
