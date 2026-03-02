"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

const TYPE_OPTIONS = ["PUBLIC", "PRIVATE", "NGO", "GOVERNMENT", "STARTUP", "OTHER"];
const SIZE_OPTIONS = ["SIZE_1_10", "SIZE_11_50", "SIZE_51_200", "SIZE_201_500", "SIZE_501_1000", "SIZE_1001_PLUS"];

interface CompanyDashboardEditProfileProps {
  slug: string;
}

export function CompanyDashboardEditProfile({ slug }: CompanyDashboardEditProfileProps) {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    name: "",
    industry: "",
    type: "",
    size: "",
    founded: "",
    hq: "",
    website: "",
    linkedin: "",
    twitter: "",
    facebook: "",
    instagram: "",
    mission: "",
    about: "",
    specialties: "" as string,
  });
  const [verified, setVerified] = useState(false);

  useEffect(() => {
    fetch(`/api/companies/${slug}`)
      .then((r) => r.json())
      .then((d) => {
        if (d.data) {
          const c = d.data;
          setForm({
            name: c.name ?? "",
            industry: c.industry ?? "",
            type: c.type ?? "",
            size: c.size ?? "",
            founded: c.founded != null ? String(c.founded) : "",
            hq: c.hq ?? "",
            website: c.website ?? "",
            linkedin: c.linkedin ?? "",
            twitter: c.twitter ?? "",
            facebook: c.facebook ?? "",
            instagram: c.instagram ?? "",
            mission: c.mission ?? "",
            about: c.about ?? "",
            specialties: Array.isArray(c.specialties) ? c.specialties.join(", ") : "",
          });
          setVerified(!!c.verified);
        }
        setLoading(false);
      });
  }, [slug]);

  const handleSave = async () => {
    setSaving(true);
    const specialties = form.specialties.split(",").map((s) => s.trim()).filter(Boolean);
    const res = await fetch(`/api/companies/${slug}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: form.name || undefined,
        industry: form.industry || undefined,
        type: form.type || undefined,
        size: form.size || undefined,
        founded: form.founded ? parseInt(form.founded, 10) : undefined,
        hq: form.hq || undefined,
        website: form.website || undefined,
        linkedin: form.linkedin || undefined,
        twitter: form.twitter || undefined,
        facebook: form.facebook || undefined,
        instagram: form.instagram || undefined,
        mission: form.mission || undefined,
        about: form.about || undefined,
        specialties: specialties.length ? specialties : undefined,
      }),
    });
    setSaving(false);
    if (res.ok) return;
    const err = await res.json();
    alert(err?.error ?? "Failed to save");
  };

  if (loading) return <p className="text-muted-foreground">Loading...</p>;

  return (
    <Card>
      <CardHeader>
        <CardTitle>Edit profile</CardTitle>
        {verified && <p className="text-sm text-muted-foreground">Verified ✓ (cannot change from this form)</p>}
      </CardHeader>
      <CardContent className="space-y-4">
        <div>
          <Label>Name</Label>
          <Input value={form.name} onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))} />
        </div>
        <div>
          <Label>Industry</Label>
          <Input value={form.industry} onChange={(e) => setForm((f) => ({ ...f, industry: e.target.value }))} />
        </div>
        <div>
          <Label>Type</Label>
          <Select value={form.type || undefined} onValueChange={(v) => setForm((f) => ({ ...f, type: v }))}>
            <SelectTrigger><SelectValue placeholder="Select" /></SelectTrigger>
            <SelectContent>
              {TYPE_OPTIONS.map((o) => (
                <SelectItem key={o} value={o}>{o.replace(/_/g, " ")}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div>
          <Label>Size</Label>
          <Select value={form.size || undefined} onValueChange={(v) => setForm((f) => ({ ...f, size: v }))}>
            <SelectTrigger><SelectValue placeholder="Select" /></SelectTrigger>
            <SelectContent>
              {SIZE_OPTIONS.map((o) => (
                <SelectItem key={o} value={o}>{o.replace(/_/g, " ")}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div>
          <Label>Founded (year)</Label>
          <Input type="number" value={form.founded} onChange={(e) => setForm((f) => ({ ...f, founded: e.target.value }))} />
        </div>
        <div>
          <Label>HQ</Label>
          <Input value={form.hq} onChange={(e) => setForm((f) => ({ ...f, hq: e.target.value }))} />
        </div>
        <div>
          <Label>Website</Label>
          <Input value={form.website} onChange={(e) => setForm((f) => ({ ...f, website: e.target.value }))} />
        </div>
        <div>
          <Label>LinkedIn</Label>
          <Input value={form.linkedin} onChange={(e) => setForm((f) => ({ ...f, linkedin: e.target.value }))} />
        </div>
        <div>
          <Label>Twitter</Label>
          <Input value={form.twitter} onChange={(e) => setForm((f) => ({ ...f, twitter: e.target.value }))} />
        </div>
        <div>
          <Label>Facebook</Label>
          <Input value={form.facebook} onChange={(e) => setForm((f) => ({ ...f, facebook: e.target.value }))} />
        </div>
        <div>
          <Label>Instagram</Label>
          <Input value={form.instagram} onChange={(e) => setForm((f) => ({ ...f, instagram: e.target.value }))} />
        </div>
        <div>
          <Label>Mission</Label>
          <Input value={form.mission} onChange={(e) => setForm((f) => ({ ...f, mission: e.target.value }))} />
        </div>
        <div>
          <Label>About (rich text)</Label>
          <textarea className="w-full min-h-[120px] rounded-md border border-input bg-background px-3 py-2 text-sm" value={form.about} onChange={(e) => setForm((f) => ({ ...f, about: e.target.value }))} />
        </div>
        <div>
          <Label>Specialties (comma-separated, max 20)</Label>
          <Input value={form.specialties} onChange={(e) => setForm((f) => ({ ...f, specialties: e.target.value }))} placeholder="e.g. SaaS, B2B" />
        </div>
        <Button onClick={handleSave} disabled={saving}>{saving ? "Saving..." : "Save"}</Button>
      </CardContent>
    </Card>
  );
}
