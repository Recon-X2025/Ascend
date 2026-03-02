"use client";

import { useCallback, useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

interface CompanyDashboardTeamProps {
  slug: string;
}

function VerifiedDomainsSection({ slug }: { slug: string }) {
  const [domains, setDomains] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [newDomain, setNewDomain] = useState("");
  const [saving, setSaving] = useState(false);

  const load = useCallback(() => {
    fetch(`/api/companies/${slug}/domains`)
      .then((r) => r.json())
      .then((d) => { if (d.domains) setDomains(d.domains); setLoading(false); })
      .catch(() => setLoading(false));
  }, [slug]);
  useEffect(() => load(), [load]);

  const addDomain = async () => {
    const d = newDomain.trim().toLowerCase().replace(/^https?:\/\//, "").split("/")[0];
    if (!d || d.includes(" ")) return;
    setSaving(true);
    const next = [...domains, d];
    const res = await fetch(`/api/companies/${slug}/domains`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ domains: next }),
    });
    if (res.ok) { setDomains(next); setNewDomain(""); }
    setSaving(false);
  };

  const removeDomain = async (domain: string) => {
    const next = domains.filter((x) => x !== domain);
    setSaving(true);
    const res = await fetch(`/api/companies/${slug}/domains`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ domains: next }),
    });
    if (res.ok) setDomains(next);
    setSaving(false);
  };

  if (loading) return null;
  return (
    <Card className="mt-6">
      <CardHeader>
        <CardTitle>Verified employee domains</CardTitle>
        <p className="text-sm text-muted-foreground mt-1">
          Employees whose work email matches these domains are automatically granted access to your internal job portal.
        </p>
      </CardHeader>
      <CardContent className="space-y-3">
        {domains.length > 0 && (
          <ul className="flex flex-wrap gap-2">
            {domains.map((d) => (
              <li key={d} className="flex items-center gap-1 rounded bg-muted px-2 py-1 text-sm">
                {d}
                <button type="button" onClick={() => removeDomain(d)} className="text-muted-foreground hover:text-foreground" aria-label={`Remove ${d}`}>✕</button>
              </li>
            ))}
          </ul>
        )}
        <div className="flex gap-2">
          <Input
            placeholder="e.g. yourcompany.com"
            value={newDomain}
            onChange={(e) => setNewDomain(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && addDomain()}
            className="max-w-xs"
          />
          <Button onClick={addDomain} disabled={saving || !newDomain.trim()}>Add domain</Button>
        </div>
      </CardContent>
    </Card>
  );
}

interface AdminRow {
  id: string;
  userId: string;
  name: string | null;
  email: string | null;
  role: string;
  createdAt: string;
}

export function CompanyDashboardTeam({ slug }: CompanyDashboardTeamProps) {
  const [admins, setAdmins] = useState<AdminRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [inviteEmail, setInviteEmail] = useState("");
  const [inviteSent, setInviteSent] = useState(false);

  const loadAdmins = useCallback(() => {
    fetch(`/api/companies/${slug}/admins`).then((r) => r.json()).then((d) => {
      if (d.admins) setAdmins(d.admins);
      setLoading(false);
    });
  }, [slug]);
  useEffect(() => { loadAdmins(); }, [loadAdmins]);

  const invite = async () => {
    if (!inviteEmail.trim()) return;
    const res = await fetch(`/api/companies/${slug}/admins/invite`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email: inviteEmail.trim() }),
    });
    if (res.ok) { setInviteSent(true); setInviteEmail(""); } else alert((await res.json()).error);
  };

  const removeAdmin = async (adminId: string) => {
    if (!confirm("Remove this admin?")) return;
    const res = await fetch(`/api/companies/${slug}/admins/${adminId}`, { method: "DELETE" });
    if (res.ok) loadAdmins();
    else alert((await res.json()).error);
  };

  if (loading) return <p className="text-muted-foreground">Loading...</p>;

  return (
    <div className="space-y-6">
    <Card>
      <CardHeader><CardTitle>Team</CardTitle></CardHeader>
      <CardContent className="space-y-6">
        <div>
          <Label>Invite team member</Label>
          <div className="mt-2 flex gap-2">
            <Input type="email" placeholder="email@example.com" value={inviteEmail} onChange={(e) => setInviteEmail(e.target.value)} className="max-w-xs" />
            <Button onClick={invite}>Invite</Button>
          </div>
          {inviteSent && <p className="text-sm text-green-600 mt-1">Invite sent.</p>}
        </div>
        <div>
          <h3 className="font-medium mb-2">Current admins</h3>
          <ul className="space-y-2">
            {admins.map((a) => (
              <li key={a.id} className="flex items-center justify-between rounded border p-2">
                <span className="text-sm">{a.name ?? "—"} — {a.email ?? "—"} — {a.role}</span>
                <Button size="sm" variant="destructive" onClick={() => removeAdmin(a.id)}>Remove</Button>
              </li>
            ))}
          </ul>
        </div>
      </CardContent>
    </Card>
    <VerifiedDomainsSection slug={slug} />
    </div>
  );
}
