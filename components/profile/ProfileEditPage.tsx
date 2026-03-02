"use client";

import { useEffect, useState, useRef } from "react";
import Image from "next/image";
import Link from "next/link";
import { useSession } from "next-auth/react";
import { Camera } from "lucide-react";
import toast from "react-hot-toast";
import { CompletionRing } from "./CompletionRing";
import { ProfileSections } from "./ProfileSections";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

interface ProfileData {
  profile: {
    id: string;
    userId: string;
    headline: string | null;
    summary: string | null;
    avatarUrl: string | null;
    bannerUrl: string | null;
    city: string | null;
    state: string | null;
    country: string | null;
    username: string | null;
    openToWork: boolean;
    openToWorkVisibility: string;
    [key: string]: unknown;
  };
  completion: {
    total: number;
    missing: string[];
    nextStep: string;
  };
}

const AVATAR_TYPES = ["image/jpeg", "image/png", "image/webp"];
const AVATAR_MAX = 2 * 1024 * 1024;
const BANNER_MAX = 4 * 1024 * 1024;

export function ProfileEditPage() {
  const { data: session } = useSession();
  const [data, setData] = useState<ProfileData | null>(null);
  const [loading, setLoading] = useState(true);
  const [openToWork, setOpenToWork] = useState(false);
  const [openToWorkVisibility, setOpenToWorkVisibility] = useState<"ALL" | "RECRUITERS_ONLY">("RECRUITERS_ONLY");
  const [avatarUploading, setAvatarUploading] = useState(false);
  const [bannerUploading, setBannerUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const bannerInputRef = useRef<HTMLInputElement>(null);

  const fetchProfile = async () => {
    const res = await fetch("/api/profile/me");
    if (!res.ok) return;
    const json = await res.json();
    if (json.success && json.data) {
      setData(json.data);
      setOpenToWork(json.data.profile?.openToWork ?? false);
      setOpenToWorkVisibility(json.data.profile?.openToWorkVisibility ?? "RECRUITERS_ONLY");
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchProfile();
  }, []);

  const handleOpenToWorkChange = async (checked: boolean, visibility: "ALL" | "RECRUITERS_ONLY") => {
    setOpenToWork(checked);
    setOpenToWorkVisibility(visibility);
    const res = await fetch("/api/profile/me/open-to-work", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ openToWork: checked, visibility }),
    });
    if (!res.ok) return;
  };

  const handleAvatarChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!AVATAR_TYPES.includes(file.type)) {
      toast.error("Please upload a JPG, PNG, or WebP image");
      return;
    }
    if (file.size > AVATAR_MAX) {
      toast.error("Image must be smaller than 2MB");
      return;
    }
    setAvatarUploading(true);
    const formData = new FormData();
    formData.append("file", file);
    try {
      const res = await fetch("/api/profile/me/avatar", { method: "POST", body: formData });
      const json = await res.json();
      if (json.success && json.data?.avatarUrl) {
        setData((prev) =>
          prev ? { ...prev, profile: { ...prev.profile, avatarUrl: json.data.avatarUrl } } : null
        );
        toast.success("Profile photo updated");
      } else {
        toast.error(json.error ?? "Upload failed");
      }
    } catch {
      toast.error("Upload failed — please try again");
    } finally {
      setAvatarUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  const handleBannerChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!AVATAR_TYPES.includes(file.type)) {
      toast.error("Please upload a JPG, PNG, or WebP image");
      return;
    }
    if (file.size > BANNER_MAX) {
      toast.error("Image must be smaller than 4MB");
      return;
    }
    setBannerUploading(true);
    const formData = new FormData();
    formData.append("file", file);
    try {
      const res = await fetch("/api/profile/me/banner", { method: "POST", body: formData });
      const json = await res.json();
      if (json.success && json.data?.bannerUrl) {
        setData((prev) =>
          prev ? { ...prev, profile: { ...prev.profile, bannerUrl: json.data.bannerUrl } } : null
        );
        toast.success("Banner updated");
      } else {
        toast.error(json.error ?? "Upload failed");
      }
    } catch {
      toast.error("Upload failed — please try again");
    } finally {
      setBannerUploading(false);
      if (bannerInputRef.current) bannerInputRef.current.value = "";
    }
  };

  if (loading) {
    return (
      <div className="page-container page-section">
        <div className="skeleton h-64 w-full rounded-xl" />
      </div>
    );
  }

  if (!data) {
    return (
      <div className="page-container page-section">
        <p className="text-text-secondary">Unable to load profile.</p>
      </div>
    );
  }

  const { profile, completion } = data;
  const name = session?.user?.name ?? "You";
  const initials = name.split(" ").map((n) => n[0]).join("").toUpperCase().slice(0, 2);
  const avatarSrc = profile.avatarUrl ? `/api/files/${profile.avatarUrl}` : session?.user?.image ?? undefined;

  return (
    <div className="page-container page-section">
      <div className="flex flex-col lg:flex-row gap-8">
        {/* Sidebar */}
        <aside className="lg:w-72 shrink-0 space-y-6">
          <div className="ascend-card p-6 flex flex-col items-center text-center">
            <div className="relative group w-24 h-24 mx-auto">
              <Avatar className="h-24 w-24 border-4 border-white shadow-card">
                <AvatarImage src={avatarSrc} alt="" />
                <AvatarFallback className="bg-accent-green/20 text-accent-green text-2xl">
                  {initials}
                </AvatarFallback>
              </Avatar>
              {openToWork && (
                <span
                  className="absolute -bottom-0.5 -right-0.5 h-6 w-6 rounded-full border-2 border-white bg-accent-green"
                  title="Open to work"
                />
              )}
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                disabled={avatarUploading}
                className="absolute inset-0 rounded-full bg-black/50 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity duration-150 disabled:cursor-not-allowed"
                aria-label="Upload profile photo"
              >
                {avatarUploading ? (
                  <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                ) : (
                  <Camera className="w-5 h-5 text-white" />
                )}
              </button>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/jpeg,image/png,image/webp"
                className="hidden"
                onChange={handleAvatarChange}
              />
            </div>
            <p className="text-xs text-text-secondary text-center mt-2">
              Click to upload photo
              <br />
              JPG, PNG or WebP · Max 2MB
            </p>
            <p className="mt-2 font-semibold text-text-primary">{name}</p>
            {profile.headline && (
              <p className="text-sm text-text-secondary">{profile.headline}</p>
            )}
            <div className="mt-4">
              <CompletionRing percentage={completion.total} />
              <p className="text-xs text-text-secondary mt-1">Profile complete</p>
            </div>
            {completion.missing.length > 0 && (
              <ul className="mt-4 text-left w-full text-sm text-text-secondary space-y-1">
                {completion.missing.slice(0, 5).map((item, i) => (
                  <li key={i} className="flex items-center gap-2">
                    <span className="text-accent-green">•</span>
                    {item}
                  </li>
                ))}
              </ul>
            )}
            <Link href={profile.username ? `/profile/${profile.username}` : "/profile/edit"} className="mt-4">
              <Button variant="ghost" size="sm" className="btn-ghost w-full">
                View public profile
              </Button>
            </Link>
            <div className="mt-4 w-full border-t border-border pt-4">
              <label className="flex items-center justify-between gap-2 cursor-pointer">
                <span className="text-sm font-medium text-text-primary">Open to work</span>
                <input
                  type="checkbox"
                  checked={openToWork}
                  onChange={(e) => handleOpenToWorkChange(e.target.checked, openToWorkVisibility)}
                  className="rounded border-border text-accent-green focus:ring-accent-green"
                />
              </label>
              {openToWork && (
                <select
                  value={openToWorkVisibility}
                  onChange={(e) =>
                    handleOpenToWorkChange(true, e.target.value as "ALL" | "RECRUITERS_ONLY")
                  }
                  className="ascend-input mt-2 text-sm"
                >
                  <option value="RECRUITERS_ONLY">Recruiters only</option>
                  <option value="ALL">Everyone</option>
                </select>
              )}
            </div>
          </div>
        </aside>

        {/* Main content */}
        <div className="flex-1 min-w-0">
          <div className="relative group h-40 rounded-xl overflow-hidden bg-muted border border-border mb-8">
            {profile.bannerUrl ? (
              <Image
                src={`/api/files/${profile.bannerUrl}`}
                alt=""
                fill
                className="object-cover"
                unoptimized
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center text-text-secondary" />
            )}
            <button
              type="button"
              onClick={() => bannerInputRef.current?.click()}
              disabled={bannerUploading}
              className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity duration-150 disabled:cursor-not-allowed"
              aria-label="Upload banner"
            >
              {bannerUploading ? (
                <div className="w-8 h-8 border-2 border-white border-t-transparent rounded-full animate-spin" />
              ) : (
                <Camera className="w-8 h-8 text-white" />
              )}
            </button>
            <input
              ref={bannerInputRef}
              type="file"
              accept="image/jpeg,image/png,image/webp"
              className="hidden"
              onChange={handleBannerChange}
            />
          </div>
          <p className="text-xs text-text-secondary -mt-6 mb-6">Click banner to upload · JPG, PNG or WebP · Max 4MB</p>
          <ProfileSections profile={profile} onUpdate={fetchProfile} />
        </div>
      </div>
    </div>
  );
}
