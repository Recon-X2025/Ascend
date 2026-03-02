"use client";

import useSWR from "swr";
import Link from "next/link";
import { Button } from "@/components/ui/button";

const fetcher = (url: string) => fetch(url).then((r) => r.json());

export default function AdminMarketplaceCoursesPage() {
  const { data } = useSWR("/api/admin/marketplace/courses", fetcher);
  const items = data?.items ?? [];

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Course recommendations</h1>
      <p className="text-muted-foreground">Add and edit courses. Click analytics per course.</p>
      {items.length === 0 ? (
        <p className="text-muted-foreground">No courses yet. Use POST /api/admin/marketplace/courses to add.</p>
      ) : (
        <ul className="space-y-2">
          {items.map((c: { id: string; title: string; skill: string; provider: string; clickCount: number }) => (
            <li key={c.id} className="flex items-center justify-between rounded-lg border p-4">
              <div>
                <p className="font-medium">{c.title}</p>
                <p className="text-sm text-muted-foreground">{c.skill} · {c.provider} · {c.clickCount} clicks</p>
              </div>
              <Link href={`/dashboard/admin/marketplace/courses/${c.id}`}><Button variant="outline" size="sm">Edit</Button></Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
