import { Suspense } from "react";
import { CompaniesDiscovery } from "@/components/company/CompaniesDiscovery";

export const dynamic = "force-dynamic";

export default function CompaniesPage() {
  return (
    <div className="page-container py-8">
      <h1 className="text-2xl font-semibold text-text-primary">Companies</h1>
      <p className="mt-1 text-muted-foreground">Discover companies and read reviews.</p>
      <Suspense fallback={<div className="mt-6 text-muted-foreground">Loading…</div>}>
        <CompaniesDiscovery />
      </Suspense>
    </div>
  );
}
