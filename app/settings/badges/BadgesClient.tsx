"use client";

import { useState } from "react";
import useSWR from "swr";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader } from "@/components/ui/card";

const fetcher = (url: string) => fetch(url).then((r) => r.json());

export function BadgesClient() {
  const { data, mutate } = useSWR("/api/user/badges", fetcher);
  const [adding, setAdding] = useState(false);
  const [provider, setProvider] = useState("");
  const [skill, setSkill] = useState("");
  const [score, setScore] = useState("");
  const [issuedAt, setIssuedAt] = useState(new Date().toISOString().slice(0, 10));

  const badges = data?.badges ?? [];

  const handleAdd = async () => {
    if (!provider.trim() || !skill.trim()) return;
    setAdding(true);
    try {
      const res = await fetch("/api/user/badges", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          provider: provider.trim(),
          skill: skill.trim(),
          score: score ? parseFloat(score) : undefined,
          issuedAt: new Date(issuedAt).toISOString(),
        }),
      });
      if (res.ok) {
        setProvider("");
        setSkill("");
        setScore("");
        mutate();
      }
    } finally {
      setAdding(false);
    }
  };

  const handleDelete = async (id: string) => {
    const res = await fetch(`/api/user/badges/${id}`, { method: "DELETE" });
    if (res.ok) mutate();
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader><h2 className="text-lg font-semibold">Add badge</h2></CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label>Provider (e.g. HackerRank, Coursera)</Label>
            <Input value={provider} onChange={(e) => setProvider(e.target.value)} placeholder="HackerRank" />
          </div>
          <div>
            <Label>Skill</Label>
            <Input value={skill} onChange={(e) => setSkill(e.target.value)} placeholder="JavaScript" />
          </div>
          <div>
            <Label>Score (optional)</Label>
            <Input type="number" value={score} onChange={(e) => setScore(e.target.value)} placeholder="85" />
          </div>
          <div>
            <Label>Issue date</Label>
            <Input type="date" value={issuedAt} onChange={(e) => setIssuedAt(e.target.value)} />
          </div>
          <Button onClick={handleAdd} disabled={adding || !provider.trim() || !skill.trim()}>
            {adding ? "Adding..." : "Add badge"}
          </Button>
        </CardContent>
      </Card>
      <div>
        <h2 className="text-lg font-semibold mb-2">Your badges</h2>
        {badges.length === 0 ? (
          <p className="text-muted-foreground">No badges yet.</p>
        ) : (
          <ul className="space-y-2">
            {badges.map((b: { id: string; provider: string; skill: string; score: number | null; status: string }) => (
              <li key={b.id} className="flex items-center justify-between rounded-lg border p-4">
                <span className="font-medium">{b.provider} · {b.skill}</span>
                {b.score != null && <span className="text-muted-foreground">{b.score}</span>}
                <Button variant="outline" size="sm" onClick={() => handleDelete(b.id)}>Remove</Button>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
