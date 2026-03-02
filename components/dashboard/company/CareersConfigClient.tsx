"use client";

import useSWR from "swr";
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import toast from "react-hot-toast";

const fetcher = (url: string) => fetch(url).then((r) => r.json());

export function CareersConfigClient() {
  const { data, mutate } = useSWR("/api/companies/me/careers-config", fetcher);
  const [saving, setSaving] = useState(false);
  const [heroTitle, setHeroTitle] = useState("");
  const [heroSubtitle, setHeroSubtitle] = useState("");

  useEffect(() => {
    if (data?.data) {
      setHeroTitle(data.data.heroTitle ?? "");
      setHeroSubtitle(data.data.heroSubtitle ?? "");
    }
  }, [data?.data]);

  const companySlug = data?.data?.companySlug;

  const handleSave = async () => {
    setSaving(true);
    const res = await fetch("/api/companies/me/careers-config", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ heroTitle, heroSubtitle }),
    });
    setSaving(false);
    if (!res.ok) {
      toast.error("Failed to save");
      return;
    }
    toast.success("Saved");
    mutate();
  };

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-semibold text-ink">Careers Page</h1>
      <p className="text-ink-2">
        Customize your white-label careers page. Enterprise plan required.
      </p>
      <div className="space-y-4 max-w-md">
        <div>
          <label className="block text-sm font-medium text-ink mb-1">Hero title</label>
          <input
            type="text"
            value={heroTitle}
            onChange={(e) => setHeroTitle(e.target.value)}
            className="w-full rounded-md border border-border px-3 py-2"
            placeholder="Join our team"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-ink mb-1">Hero subtitle</label>
          <input
            type="text"
            value={heroSubtitle}
            onChange={(e) => setHeroSubtitle(e.target.value)}
            className="w-full rounded-md border border-border px-3 py-2"
            placeholder="Build your career with us"
          />
        </div>
        <Button onClick={handleSave} disabled={saving}>
          {saving ? "Saving..." : "Save"}
        </Button>
        {companySlug && (
          <Button variant="outline" asChild>
            <a href={`/careers/${companySlug}`} target="_blank" rel="noreferrer">
              Preview
            </a>
          </Button>
        )}
      </div>
    </div>
  );
}
