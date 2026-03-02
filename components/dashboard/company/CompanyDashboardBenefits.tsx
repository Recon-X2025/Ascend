"use client";

import { useCallback, useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export function CompanyDashboardBenefits(props: { slug: string }) {
  const slug = props.slug;
  const [list, setList] = useState<Array<{ id: string; label: string; icon: string | null; emoji: string | null; order: number }>>([]);
  const [loading, setLoading] = useState(true);
  const [label, setLabel] = useState("");
  const [emoji, setEmoji] = useState("");

  const load = useCallback(() => {
    fetch("/api/companies/" + slug).then((r) => r.json()).then((d) => {
      setList(d.data && d.data.benefits ? d.data.benefits : []);
      setLoading(false);
    });
  }, [slug]);
  useEffect(() => { load(); }, [load]);

  function add() {
    if (!label.trim()) return;
    fetch("/api/companies/" + slug + "/benefits", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ label: label.trim(), emoji: emoji.trim() || undefined }) }).then((r) => { if (r.ok) { load(); setLabel(""); setEmoji(""); } });
  }

  function remove(id: string) {
    if (!confirm("Remove?")) return;
    fetch("/api/companies/" + slug + "/benefits/" + id, { method: "DELETE" }).then((r) => { if (r.ok) load(); });
  }

  if (loading) return <p>Loading...</p>;
  return (
    <Card>
      <CardHeader><CardTitle>Benefits</CardTitle><p className="text-sm text-muted-foreground">Shown on your company page.</p></CardHeader>
      <CardContent className="space-y-4">
        <div className="flex gap-2"><Input placeholder="Emoji" value={emoji} onChange={(e) => setEmoji(e.target.value)} className="w-20" /><Input placeholder="Label" value={label} onChange={(e) => setLabel(e.target.value)} /><Button onClick={add}>Add</Button></div>
        <ul className="space-y-2">{list.map((b) => <li key={b.id} className="flex justify-between border p-2"><span>{b.emoji || b.icon || "•"} {b.label}</span><Button size="sm" variant="destructive" onClick={() => remove(b.id)}>Delete</Button></li>)}</ul>
      </CardContent>
    </Card>
  );
}
