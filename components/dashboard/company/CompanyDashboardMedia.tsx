"use client";

import { useCallback, useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

interface MediaItem {
  id: string;
  type: string;
  url: string;
  caption: string | null;
}

export function CompanyDashboardMedia(props: { slug: string }) {
  const slug = props.slug;
  const [list, setList] = useState<MediaItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [videoUrl, setVideoUrl] = useState("");
  const [tourUrl, setTourUrl] = useState("");

  const load = useCallback(() => {
    fetch("/api/companies/" + encodeURIComponent(slug))
      .then((res) => res.json())
      .then((data) => {
        if (data.data && Array.isArray(data.data.media)) setList(data.data.media);
        setLoading(false);
      });
  }, [slug]);
  useEffect(() => { load(); }, [load]);

  const addPhoto = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const form = new FormData();
    form.set("type", "PHOTO");
    form.set("file", file);
    fetch("/api/companies/" + encodeURIComponent(slug) + "/media", { method: "POST", body: form }).then((res) => res.ok && load());
    e.target.value = "";
  };

  const addVideo = () => {
    if (!videoUrl.trim()) return;
    fetch("/api/companies/" + encodeURIComponent(slug) + "/media", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ type: "VIDEO_EMBED", url: videoUrl.trim() }),
    }).then((res) => { if (res.ok) { setVideoUrl(""); load(); } });
  };

  const addTour = () => {
    if (!tourUrl.trim()) return;
    fetch("/api/companies/" + encodeURIComponent(slug) + "/media", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ type: "VIRTUAL_TOUR", url: tourUrl.trim() }),
    }).then((res) => { if (res.ok) { setTourUrl(""); load(); } });
  };

  const remove = (id: string) => {
    if (!confirm("Remove this item?")) return;
    fetch("/api/companies/" + encodeURIComponent(slug) + "/media/" + id, { method: "DELETE" }).then((res) => res.ok && load());
  };

  if (loading) return <p>Loading...</p>;
  const hasVideo = list.some((m) => m.type === "VIDEO_EMBED");
  const hasTour = list.some((m) => m.type === "VIRTUAL_TOUR");
  return (
    <Card>
      <CardHeader>
        <CardTitle>Media</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div>
          <Label>Add photo (max 10)</Label>
          <Input type="file" accept="image/*" onChange={addPhoto} className="mt-2" />
        </div>
        <div>
          <Label>Add video URL (max 1)</Label>
          <div className="mt-2 flex gap-2">
            <Input value={videoUrl} onChange={(e) => setVideoUrl(e.target.value)} placeholder="https://..." />
            <Button onClick={addVideo} disabled={hasVideo}>Add</Button>
          </div>
        </div>
        <div>
          <Label>Add virtual tour URL (max 1)</Label>
          <div className="mt-2 flex gap-2">
            <Input value={tourUrl} onChange={(e) => setTourUrl(e.target.value)} placeholder="https://..." />
            <Button onClick={addTour} disabled={hasTour}>Add</Button>
          </div>
        </div>
        <div>
          <h3 className="font-medium mb-2">Current items</h3>
          <ul className="space-y-2">
            {list.map((m) => (
              <li key={m.id} className="flex items-center justify-between rounded border p-2">
                <span className="text-sm">{m.type} — {m.caption || m.url.slice(0, 50)}</span>
                <Button size="sm" variant="destructive" onClick={() => remove(m.id)}>Delete</Button>
              </li>
            ))}
          </ul>
        </div>
      </CardContent>
    </Card>
  );
}
