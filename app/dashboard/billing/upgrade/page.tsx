import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth/nextauth";
import { redirect } from "next/navigation";
import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

export default async function BillingUpgradePage() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) redirect("/auth/login");

  return (
    <div className="space-y-8">
      <h1 className="text-2xl font-semibold">Upgrade plan</h1>
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Seeker Premium</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground mb-2">₹499/month · ₹3,999/year</p>
          <p className="text-sm mb-4">Fit score breakdown, salary insights, resume optimiser, who viewed your profile.</p>
          <Button asChild><Link href="/dashboard/billing">Subscribe (coming soon)</Link></Button>
        </CardContent>
      </Card>
      <p className="text-sm text-muted-foreground">
        Enterprise (₹29,999+/month): <a href="mailto:sales@ascend.com" className="text-primary hover:underline">Contact Sales</a>
      </p>
    </div>
  );
}
