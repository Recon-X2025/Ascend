import { redirect } from "next/navigation";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth/nextauth";
import Link from "next/link";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

export default async function AdminMarketplacePage() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id || (session.user as { role?: string }).role !== "PLATFORM_ADMIN") {
    redirect("/dashboard");
  }

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Marketplace</h1>
      <Tabs defaultValue="overview">
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
        </TabsList>
        <TabsContent value="overview" className="mt-4">
          <Card>
            <CardHeader>
              <h2 className="text-lg font-semibold">Quick links</h2>
            </CardHeader>
            <CardContent className="flex flex-wrap gap-4">
              <Link href="/dashboard/admin/marketplace/providers">
                <Button variant="outline">Review providers</Button>
              </Link>
              <Link href="/dashboard/admin/marketplace/orders">
                <Button variant="outline">Orders & disputes</Button>
              </Link>
              <Link href="/dashboard/admin/marketplace/revenue">
                <Button variant="outline">Revenue</Button>
              </Link>
              <Link href="/dashboard/admin/marketplace/courses">
                <Button variant="outline">Course recommendations</Button>
              </Link>
              <Link href="/dashboard/admin/marketplace/badges">
                <Button variant="outline">Badges</Button>
              </Link>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
