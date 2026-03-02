"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useSession } from "next-auth/react";
import { signOut } from "next-auth/react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import toast from "react-hot-toast";

interface AccountData {
  name: string | null;
  email: string;
  image: string | null;
  hasPassword: boolean;
  providers: string[];
}

export default function AccountSettingsPage() {
  const { status } = useSession();
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<AccountData | null>(null);
  const [name, setName] = useState("");
  const [savingName, setSavingName] = useState(false);
  const [passwordForm, setPasswordForm] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  });
  const [changingPassword, setChangingPassword] = useState(false);

  useEffect(() => {
    (async () => {
      const res = await fetch("/api/settings/account");
      if (!res.ok) return;
      const json = await res.json();
      if (json.success && json.data) {
        setData(json.data);
        setName(json.data.name ?? "");
      }
      setLoading(false);
    })();
  }, []);

  const handleSaveName = async (e: React.FormEvent) => {
    e.preventDefault();
    setSavingName(true);
    const res = await fetch("/api/settings/account", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: name.trim() || null }),
    });
    setSavingName(false);
    const json = await res.json().catch(() => ({}));
    if (!res.ok) {
      toast.error(json.error ?? "Failed to update");
      return;
    }
    toast.success("Saved");
  };

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setChangingPassword(true);
    const res = await fetch("/api/settings/account/password", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(passwordForm),
    });
    setChangingPassword(false);
    const json = await res.json().catch(() => ({}));
    if (!res.ok) {
      toast.error(json.error ?? "Failed to update password");
      return;
    }
    toast.success("Password updated. Signing you out.");
    setPasswordForm({ currentPassword: "", newPassword: "", confirmPassword: "" });
    await signOut({ redirect: false });
    window.location.href = "/auth/login";
  };

  if (status === "loading" || loading) {
    return (
      <div className="space-y-8">
        <h1 className="text-2xl font-semibold text-text-primary">Account Settings</h1>
        <div className="skeleton h-48 rounded-xl" />
      </div>
    );
  }

  if (!data) {
    return (
      <div className="space-y-8">
        <h1 className="text-2xl font-semibold text-text-primary">Account Settings</h1>
        <p className="text-text-secondary">Unable to load account.</p>
      </div>
    );
  }

  const initials = (data.name ?? data.email).slice(0, 2).toUpperCase();

  return (
    <div className="space-y-8">
      <h1 className="text-2xl font-semibold text-text-primary">Account Settings</h1>

      <section className="space-y-4">
        <h2 className="section-title">Personal details</h2>
        <form onSubmit={handleSaveName} className="space-y-4">
          <div>
            <label className="ascend-label">Display name</label>
            <Input
              className="ascend-input max-w-md"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Your name"
            />
          </div>
          <div>
            <label className="ascend-label">Email address</label>
            <Input className="ascend-input max-w-md bg-muted" value={data.email} readOnly disabled />
            <p className="text-xs text-text-secondary mt-1">Email cannot be changed.</p>
          </div>
          <div>
            <label className="ascend-label">Profile photo</label>
            <div className="flex items-center gap-4 mt-2">
              <Avatar className="h-16 w-16">
                <AvatarImage src={data.image ?? undefined} alt="" />
                <AvatarFallback className="bg-accent-green/20 text-accent-green text-lg">
                  {initials}
                </AvatarFallback>
              </Avatar>
              <Link href="/profile/edit" className="btn-ghost text-sm">
                Change on profile
              </Link>
            </div>
          </div>
          <Button type="submit" className="btn-primary" disabled={savingName}>
            {savingName ? "Saving…" : "Save"}
          </Button>
        </form>
      </section>

      <section className="space-y-4">
        <h2 className="section-title">Password</h2>
        {data.hasPassword ? (
          <form onSubmit={handleChangePassword} className="space-y-4 max-w-md">
            <div>
              <label className="ascend-label">Current password</label>
              <Input
                type="password"
                className="ascend-input"
                value={passwordForm.currentPassword}
                onChange={(e) => setPasswordForm((p) => ({ ...p, currentPassword: e.target.value }))}
                required
                autoComplete="current-password"
              />
            </div>
            <div>
              <label className="ascend-label">New password</label>
              <Input
                type="password"
                className="ascend-input"
                value={passwordForm.newPassword}
                onChange={(e) => setPasswordForm((p) => ({ ...p, newPassword: e.target.value }))}
                required
                autoComplete="new-password"
                minLength={8}
              />
              <p className="text-xs text-text-secondary mt-1">At least 8 characters, one uppercase, one number.</p>
            </div>
            <div>
              <label className="ascend-label">Confirm new password</label>
              <Input
                type="password"
                className="ascend-input"
                value={passwordForm.confirmPassword}
                onChange={(e) => setPasswordForm((p) => ({ ...p, confirmPassword: e.target.value }))}
                required
                autoComplete="new-password"
              />
            </div>
            <Button type="submit" className="btn-primary" disabled={changingPassword}>
              {changingPassword ? "Updating…" : "Change password"}
            </Button>
            <p className="text-sm text-text-secondary">After changing your password, you will be signed out of all devices.</p>
          </form>
        ) : (
          <p className="text-text-secondary text-sm">You sign in with a connected account. No password is set.</p>
        )}
      </section>

      <section className="space-y-4">
        <h2 className="section-title">Connected accounts</h2>
        <div className="flex flex-wrap gap-2">
          {["google", "linkedin"].map((provider) => (
            <span
              key={provider}
              className={`inline-flex items-center px-3 py-1.5 rounded-full text-sm font-medium ${
                data.providers.includes(provider)
                  ? "bg-accent-green/15 text-accent-green"
                  : "bg-muted text-text-secondary"
              }`}
            >
              {provider.charAt(0).toUpperCase() + provider.slice(1)}
              {data.providers.includes(provider) ? " · Connected" : " · Connect"}
            </span>
          ))}
        </div>
        <p className="text-xs text-text-secondary">Connect buttons are coming soon.</p>
      </section>

      <section className="rounded-lg border border-destructive/50 bg-destructive/5 p-4">
        <h2 className="section-title text-destructive">Danger zone</h2>
        <p className="text-sm text-text-secondary mt-1">Permanently delete your account and all data.</p>
        <Link href="/settings/account/delete" className="btn-danger mt-3 inline-flex">
          Delete account
        </Link>
        <p className="text-xs text-text-secondary mt-2">(Delete flow coming soon)</p>
      </section>
    </div>
  );
}
