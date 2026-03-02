import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth/nextauth";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma/client";
import { getUserPlan } from "@/lib/payments/gate";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import Link from "next/link";
import { BillingInvoicesTab } from "@/components/dashboard/billing/BillingInvoicesTab";
import { BillingDetailsTab } from "@/components/dashboard/billing/BillingDetailsTab";
import { BillingResumeCreditsTab } from "@/components/dashboard/billing/BillingResumeCreditsTab";

export default async function BillingPage() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) redirect("/auth/login");
  const userId = session.user.id as string;
  const [sub, planKey, credits, events] = await Promise.all([
    prisma.userSubscription.findUnique({ where: { userId } }),
    getUserPlan(userId),
    prisma.resumeOptimisationCredit.findUnique({ where: { userId }, select: { balance: true } }).catch(() => null),
    prisma.paymentEvent.findMany({
      where: { userId },
      orderBy: { createdAt: "desc" },
      take: 20,
    }),
  ]);
  const displayPlan = sub?.status === "ACTIVE" ? (sub.planKey ?? sub.plan) : planKey;
  const showResumeCredits = planKey === "SEEKER_FREE";
  return (
    <div className="space-y-8">
      <h1 className="text-2xl font-semibold">Billing</h1>
      <Tabs defaultValue="plan">
        <TabsList>
          <TabsTrigger value="plan">Plan & Payments</TabsTrigger>
          {showResumeCredits && <TabsTrigger value="credits">Resume Credits</TabsTrigger>}
          <TabsTrigger value="invoices">Invoices</TabsTrigger>
          <TabsTrigger value="details">Billing Details</TabsTrigger>
        </TabsList>
        <TabsContent value="plan" className="space-y-6 mt-6">
          <Card>
            <CardHeader><CardTitle className="text-base">Current plan</CardTitle></CardHeader>
            <CardContent>
              <p className="font-medium">{displayPlan}</p>
              {sub?.expiresAt && (
                <p className="text-sm text-muted-foreground">Expires: {new Date(sub.expiresAt).toLocaleDateString()}</p>
              )}
              {sub?.currentPeriodEnd && !sub?.expiresAt && (
                <p className="text-sm text-muted-foreground">Next: {new Date(sub.currentPeriodEnd).toLocaleDateString()}</p>
              )}
              {(!sub || sub.plan === "FREE" || displayPlan === "SEEKER_FREE") && planKey !== "MENTOR_MARKETPLACE" && (
                <Link href="/dashboard/billing/upgrade"><Button className="mt-2">Upgrade</Button></Link>
              )}
            </CardContent>
          </Card>
          <Card>
            <CardHeader><CardTitle className="text-base">Payment history</CardTitle></CardHeader>
            <CardContent>
              {events.length === 0 ? <p className="text-sm text-muted-foreground">No payments yet.</p> : (
                <ul className="space-y-2">
                  {events.map((e) => (
                    <li key={e.id} className="flex justify-between text-sm">
                      <span>{e.description ?? "Payment"}</span>
                      <span>₹{(e.amount / 100).toFixed(0)} <Badge variant="outline">{e.gateway}</Badge></span>
                    </li>
                  ))}
                </ul>
              )}
            </CardContent>
          </Card>
        </TabsContent>
        {showResumeCredits && (
          <TabsContent value="credits" className="mt-6">
            <BillingResumeCreditsTab balance={credits?.balance ?? 0} />
          </TabsContent>
        )}
        <TabsContent value="invoices" className="mt-6">
          <BillingInvoicesTab />
        </TabsContent>
        <TabsContent value="details" className="mt-6">
          <BillingDetailsTab />
        </TabsContent>
      </Tabs>
    </div>
  );
}
