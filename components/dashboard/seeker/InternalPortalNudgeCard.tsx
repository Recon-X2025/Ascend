"use client";

import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Building2 } from "lucide-react";

interface Portal {
  companySlug: string;
  companyName: string;
}

export function InternalPortalNudgeCard({ portals }: { portals: Portal[] }) {
  if (!portals?.length) return null;
  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-base flex items-center gap-2">
          <Building2 className="h-4 w-4" />
          Internal job portals
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-2">
        {portals.map((p) => (
          <div key={p.companySlug} className="flex items-center justify-between rounded border p-2">
            <span className="text-sm">You have access to {p.companyName}&apos;s internal job portal.</span>
            <Button asChild size="sm" variant="default">
              <Link href={`/internal/${p.companySlug}`}>View Internal Jobs</Link>
            </Button>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}
