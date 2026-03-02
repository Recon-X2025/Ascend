import { redirect } from "next/navigation";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth/nextauth";

export default async function AdminMarketplaceRevenuePage() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id || (session.user as { role?: string }).role !== "PLATFORM_ADMIN") {
    redirect("/dashboard");
  }

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Marketplace revenue</h1>
      <p className="text-muted-foreground">
        GMV, platform fees, and payouts. Query PaymentEvent where metadata.type = marketplace_commission for revenue breakdown.
      </p>
    </div>
  );
}
