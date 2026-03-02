"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import toast from "react-hot-toast";

const MAX_LENGTH = 2000;

export function AboutSection({
  profile,
  onUpdate,
}: {
  profile: { summary?: string | null };
  onUpdate: () => void;
}) {
  const [summary, setSummary] = useState(profile.summary ?? "");
  const [saving, setSaving] = useState(false);

  const handleSave = async () => {
    setSaving(true);
    const res = await fetch("/api/profile/me", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ summary: summary.slice(0, MAX_LENGTH) || null }),
    });
    setSaving(false);
    if (!res.ok) {
      toast.error("Failed to save");
      return;
    }
    toast.success("Saved");
    onUpdate();
  };

  return (
    <section className="ascend-card p-6">
      <h2 className="section-title">About</h2>
      <p className="section-subtitle">A short summary for your profile (max 2000 characters)</p>
      <textarea
        className="ascend-input min-h-[120px] mt-2"
        value={summary}
        onChange={(e) => setSummary(e.target.value.slice(0, MAX_LENGTH))}
        placeholder="Tell recruiters about your experience and goals..."
        maxLength={MAX_LENGTH}
      />
      <div className="mt-2 flex items-center justify-between">
        <span className="text-xs text-text-secondary">
          {summary.length} / {MAX_LENGTH}
        </span>
        <Button className="btn-primary" onClick={handleSave} disabled={saving}>
          {saving ? "Saving…" : "Save"}
        </Button>
      </div>
    </section>
  );
}
