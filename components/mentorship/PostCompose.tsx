"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Send } from "lucide-react";

const MAX_LENGTH = 2000;

interface PostComposeProps {
  onSuccess?: () => void;
}

export function PostCompose({ onSuccess }: PostComposeProps) {
  const [content, setContent] = useState("");
  const [imageUrl, setImageUrl] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const remaining = MAX_LENGTH - content.length;

  const handleSubmit = async () => {
    const trimmed = content.trim();
    if (!trimmed) return;
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/mentorship/posts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          content: trimmed,
          imageUrl: imageUrl.trim() || undefined,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "Failed to post");
        return;
      }
      setContent("");
      setImageUrl("");
      onSuccess?.();
    } catch {
      setError("Failed to post");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="rounded-xl border border-[var(--border)] bg-[var(--surface)] p-4">
      <h3 className="font-semibold text-ink mb-2">Share an insight</h3>
      <textarea
        placeholder="What transition tip or advice would help seekers?"
        value={content}
        onChange={(e) => setContent(e.target.value.slice(0, MAX_LENGTH))}
        className="w-full min-h-[100px] rounded-lg border border-[var(--border)] bg-background px-3 py-2 text-sm resize-y"
        maxLength={MAX_LENGTH}
      />
      <div className="mt-2 flex items-center justify-between gap-4 flex-wrap">
        <input
          type="url"
          placeholder="Optional image URL"
          value={imageUrl}
          onChange={(e) => setImageUrl(e.target.value)}
          className="flex-1 min-w-[120px] rounded border border-[var(--border)] px-2 py-1.5 text-sm"
        />
        <div className="flex items-center gap-2">
          <span className={`text-xs ${remaining < 100 ? "text-amber-600" : "text-muted-foreground"}`}>
            {remaining} left
          </span>
          <Button
            size="sm"
            onClick={handleSubmit}
            disabled={loading || !content.trim()}
            className="gap-1.5"
          >
            <Send className="h-3.5 w-3.5" />
            Post
          </Button>
        </div>
      </div>
      {error && <p className="text-sm text-destructive mt-2">{error}</p>}
    </div>
  );
}
