import { redirect } from "next/navigation";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth/nextauth";

export default async function AdminMarketplaceOrdersPage() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id || (session.user as { role?: string }).role !== "PLATFORM_ADMIN") {
    redirect("/dashboard");
  }

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Marketplace orders</h1>
      <p className="text-muted-foreground">
        All orders (resume review, mock interview, coaching). Disputed orders can be refunded from the admin API PATCH /api/admin/marketplace/orders/[id]/refund.
      </p>
    </div>
  );
}
