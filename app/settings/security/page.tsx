"use client";

import { useState } from "react";
import { signOut } from "next-auth/react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import toast from "react-hot-toast";

export default function SecuritySettingsPage() {
  const router = useRouter();
  const [signingOutAll, setSigningOutAll] = useState(false);

  async function handleSignOutAllDevices() {
    setSigningOutAll(true);
    try {
      const res = await fetch("/api/auth/signout-all", { method: "POST" });
      const data = await res.json();
      if (data.success) {
        toast.success("All sessions have been signed out.");
        await signOut({ redirect: false });
        router.push("/auth/login");
        return;
      }
      toast.error(data.error ?? "Something went wrong.");
    } catch {
      toast.error("Failed to sign out all devices.");
    } finally {
      setSigningOutAll(false);
    }
  }

  return (
    <div className="container max-w-2xl py-8">
      <h1 className="text-2xl font-semibold">Security</h1>
      <p className="mt-1 text-muted-foreground">Manage 2FA and session security.</p>
      <div className="mt-6 space-y-8">
        <div>
          <Button variant="outline" disabled>
            Enable 2FA (coming soon)
          </Button>
          <p className="mt-2 text-sm text-muted-foreground">
            Two-factor authentication will be available in a future update.
          </p>
        </div>

        <div className="rounded-lg border border-destructive/50 bg-destructive/5 p-4">
          <h2 className="font-medium text-text-primary">Sign out of all devices</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            This will immediately sign you out of all devices and browsers where you are currently logged in.
          </p>
          <Button
            variant="destructive"
            className="mt-4"
            onClick={handleSignOutAllDevices}
            disabled={signingOutAll}
          >
            {signingOutAll ? "Signing out…" : "Sign out all devices"}
          </Button>
        </div>
      </div>
    </div>
  );
}
