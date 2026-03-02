"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { profileVisibilityValues, resumeVisibilityValues } from "@/lib/validations/profile";
import { YourDataSection } from "@/components/settings/YourDataSection";
import toast from "react-hot-toast";

export function PrivacySettingsForm() {
  const [loading, setLoading] = useState(true);
  const [visibility, setVisibility] = useState("PUBLIC");
  const [defaultResumeVisibility, setDefaultResumeVisibility] = useState("RECRUITERS_ONLY");
  const [hideFromCompanies, setHideFromCompanies] = useState<string[]>([]);

  useEffect(() => {
    (async () => {
      const res = await fetch("/api/profile/me");
      if (!res.ok) return;
      const json = await res.json();
      if (json.success && json.data?.profile) {
        setVisibility(json.data.profile.visibility ?? "PUBLIC");
        setDefaultResumeVisibility(json.data.profile.defaultResumeVisibility ?? "RECRUITERS_ONLY");
        setHideFromCompanies(json.data.profile.hideFromCompanies ?? []);
      }
      setLoading(false);
    })();
  }, []);

  const handleVisibilityChange = async (value: string) => {
    setVisibility(value);
    const res = await fetch("/api/profile/me/privacy", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ visibility: value }),
    });
    if (!res.ok) { toast.error("Failed to update"); return; }
    toast.success("Saved");
  };

  const handleDefaultResumeVisibilityChange = async (value: string) => {
    setDefaultResumeVisibility(value);
    const res = await fetch("/api/profile/me/privacy", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ defaultResumeVisibility: value }),
    });
    if (!res.ok) { toast.error("Failed to update"); return; }
    toast.success("Saved");
  };

  if (loading) return <div className="skeleton h-48 rounded-xl mt-6" />;

  return (
    <div className="mt-6 space-y-8">
      <div className="ascend-card p-6">
        <h2 className="section-title">Profile visibility</h2>
        <p className="section-subtitle">Who can see your full profile.</p>
        <div className="mt-4 space-y-3">
          {profileVisibilityValues.map((v) => (
            <label key={v} className="flex items-start gap-3 cursor-pointer">
              <input
                type="radio"
                name="visibility"
                value={v}
                checked={visibility === v}
                onChange={() => handleVisibilityChange(v)}
                className="mt-1 text-accent-green focus:ring-accent-green"
              />
              <div>
                <span className="font-medium text-text-primary">{v.replace(/_/g, " ")}</span>
                <p className="text-sm text-text-secondary">
                  {v === "PUBLIC" && "Anyone can see your profile."}
                  {v === "CONNECTIONS_ONLY" && "Only your connections can see your profile."}
                  {v === "RECRUITERS_ONLY" && "Only recruiters and employers can see your profile."}
                  {v === "PRIVATE" && "Only you can see your profile."}
                </p>
              </div>
            </label>
          ))}
        </div>
      </div>

      <div className="ascend-card p-6">
        <h2 className="section-title">Resume visibility</h2>
        <p className="section-subtitle">Default visibility for new resume uploads.</p>
        <div className="mt-4 space-y-3">
          {resumeVisibilityValues.map((v) => (
            <label key={v} className="flex items-start gap-3 cursor-pointer">
              <input
                type="radio"
                name="defaultResumeVisibility"
                value={v}
                checked={defaultResumeVisibility === v}
                onChange={() => handleDefaultResumeVisibilityChange(v)}
                className="mt-1 text-accent-green focus:ring-accent-green"
              />
              <div>
                <span className="font-medium text-text-primary">{v.replace(/_/g, " ")}</span>
                <p className="text-sm text-text-secondary">
                  {v === "PUBLIC" && "Anyone can view your resume."}
                  {v === "RECRUITERS_ONLY" && "Only verified recruiters can view."}
                  {v === "PRIVATE" && "Only you can view."}
                </p>
              </div>
            </label>
          ))}
        </div>
      </div>

      <div className="ascend-card p-6">
        <h2 className="section-title">Open to work</h2>
        <p className="section-subtitle">Manage your open-to-work status and who can see it.</p>
        <Link href="/profile/edit" className="btn-ghost mt-2 inline-flex">
          Manage on profile
        </Link>
      </div>

      <div className="ascend-card p-6">
        <h2 className="section-title">Hide profile from companies</h2>
        <p className="section-subtitle">
          Your profile won&apos;t appear in search results for recruiters at these companies. (Company search coming in a later phase.)
        </p>
        {hideFromCompanies.length > 0 && (
          <ul className="mt-4 space-y-2">
            {hideFromCompanies.map((id, i) => (
              <li key={i} className="flex items-center justify-between py-2 border-b border-border last:border-0">
                <span className="text-text-primary">{id}</span>
                <Button
                  variant="ghost"
                  size="sm"
                  className="text-danger"
                  onClick={async () => {
                    const next = hideFromCompanies.filter((_, j) => j !== i);
                    setHideFromCompanies(next);
                    const res = await fetch("/api/profile/me/privacy", {
                      method: "PATCH",
                      headers: { "Content-Type": "application/json" },
                      body: JSON.stringify({ hideFromCompanies: next }),
                    });
                    if (res.ok) toast.success("Removed");
                  }}
                >
                  Remove
                </Button>
              </li>
            ))}
          </ul>
        )}
        <p className="mt-4 text-sm text-text-secondary">Company search to add to this list will be available in a future phase.</p>
      </div>

      <YourDataSection />
    </div>
  );
}
