import { redirect } from "next/navigation";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth/nextauth";

export default async function AdminMarketplaceBadgesPage() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id || (session.user as { role?: string }).role !== "PLATFORM_ADMIN") {
    redirect("/dashboard");
  }

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Certification badges</h1>
      <p className="text-muted-foreground">
        View and revoke ProfileBadge records. Use PATCH /api/admin/badges/[id] with body {`{ "status": "REVOKED" }`}.
      </p>
    </div>
  );
}
