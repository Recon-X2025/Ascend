import { redirect } from "next/navigation";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth/nextauth";
import { prisma } from "@/lib/prisma/client";
import Link from "next/link";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { ProviderOrdersTab } from "./ProviderOrdersTab";
import { ProviderEarningsTab } from "./ProviderEarningsTab";
import { ProviderReviewsTab } from "./ProviderReviewsTab";

export default async function ProviderDashboardPage() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) redirect("/auth/login?callbackUrl=/dashboard/provider");

  const provider = await prisma.marketplaceProvider.findUnique({
    where: { userId: session.user.id },
  });
  if (!provider || provider.status !== "ACTIVE") {
    redirect("/marketplace/become-provider");
  }

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Provider dashboard</h1>
      <p className="text-muted-foreground text-sm">
        Ascend processes payouts by the 5th of each month. Your earnings are shown net of platform fee (20%).
      </p>
      <Tabs defaultValue="orders">
        <TabsList>
          <TabsTrigger value="orders">Orders</TabsTrigger>
          <TabsTrigger value="earnings">Earnings</TabsTrigger>
          <TabsTrigger value="reviews">Reviews</TabsTrigger>
          <TabsTrigger value="profile">Profile</TabsTrigger>
        </TabsList>
        <TabsContent value="orders" className="mt-4">
          <ProviderOrdersTab providerId={provider.id} />
        </TabsContent>
        <TabsContent value="earnings" className="mt-4">
          <ProviderEarningsTab />
        </TabsContent>
        <TabsContent value="reviews" className="mt-4">
          <ProviderReviewsTab providerId={provider.id} />
        </TabsContent>
        <TabsContent value="profile" className="mt-4">
          <Card>
            <CardHeader><h2 className="text-lg font-semibold">Edit profile</h2></CardHeader>
            <CardContent>
              <p className="text-muted-foreground mb-4">Update your bio, pricing, and availability via the API or a profile form.</p>
              <Link href="/marketplace/become-provider"><span className="text-primary underline">Provider onboarding</span></Link> (view only — use PATCH /api/marketplace/providers/me to update)
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
