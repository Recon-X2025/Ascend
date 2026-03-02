"use client";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import toast from "react-hot-toast";
import { SUPPORTED_CURRENCIES } from "@/lib/i18n/currency";

type Prefs = { preferredCurrency: string };

export default function CurrencySettingsPage() {
  const { status } = useSession();
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [prefs, setPrefs] = useState<Prefs>({
    preferredCurrency: "INR",
  });

  useEffect(() => {
    if (status === "unauthenticated") {
      router.replace("/auth/login?callbackUrl=/settings/currency");
      return;
    }
    if (status !== "authenticated") return;
    (async () => {
      const res = await fetch("/api/user/preferences");
      if (!res.ok) return;
      const json = await res.json();
      if (json.success && json.data) {
        setPrefs({
          preferredCurrency: json.data.preferredCurrency ?? "INR",
        });
      }
      setLoading(false);
    })();
  }, [status, router]);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    const res = await fetch("/api/user/preferences", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(prefs),
    });
    const json = await res.json();
    setSaving(false);
    if (!res.ok) {
      toast.error(json.error ?? "Failed to save");
      return;
    }
    toast.success("Preferences saved.");
    router.refresh();
  };

  if (status !== "authenticated" || loading) {
    return (
      <div className="flex min-h-[200px] items-center justify-center">
        <p className="text-muted-foreground">Loading...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-ink">Currency</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Choose your preferred currency for salary display (INR, USD, EUR, etc.).
        </p>
      </div>
      <form onSubmit={handleSave} className="space-y-6 max-w-md">
        <div>
          <label className="block text-sm font-medium text-ink mb-1">Currency</label>
          <select
            value={prefs.preferredCurrency}
            onChange={(e) => setPrefs((p) => ({ ...p, preferredCurrency: e.target.value }))}
            className="w-full rounded-md border border-border bg-surface px-3 py-2 text-ink"
          >
            {Object.entries(SUPPORTED_CURRENCIES).map(([code, cfg]) => (
              <option key={code} value={code}>
                {cfg.symbol} {code}
              </option>
            ))}
          </select>
        </div>
        <div className="flex gap-2">
          <Button type="submit" disabled={saving}>
            {saving ? "..." : "Save preferences"}
          </Button>
          <Button type="button" variant="outline" asChild>
            <Link href="/settings/account">Cancel</Link>
          </Button>
        </div>
      </form>
    </div>
  );
}
