import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

export default function PricingPage() {
  return (
    <div className="min-h-screen bg-background p-6">
      <div className="max-w-4xl mx-auto space-y-12">
        <h1 className="text-3xl font-bold">Pricing</h1>
        <div className="grid md:grid-cols-3 gap-6">
          <Card>
            <CardHeader>
              <CardTitle>Seeker Free</CardTitle>
              <p className="text-2xl font-semibold">₹0</p>
            </CardHeader>
            <CardContent className="space-y-2 text-sm text-muted-foreground">
              <p>• 3 resume versions</p>
              <p>• Basic fit score</p>
              <p>• Pay-per-use resume optimiser (₹99/credit)</p>
              <Button asChild variant="outline" className="w-full mt-4">
                <Link href="/auth/register">Get started</Link>
              </Button>
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle>Seeker Paid</CardTitle>
              <p className="text-2xl font-semibold">₹499<span className="text-sm font-normal">/mo</span></p>
              <p className="text-xs text-muted-foreground">₹3,999/year</p>
            </CardHeader>
            <CardContent className="space-y-2 text-sm text-muted-foreground">
              <p>• 10 resume versions</p>
              <p>• 5 resume optimisations/month</p>
              <p>• Fit score breakdown</p>
              <p>• Salary insights</p>
              <p>• Who viewed your profile</p>
              <Button asChild className="w-full mt-4">
                <Link href="/dashboard/billing/upgrade">Upgrade</Link>
              </Button>
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle>Recruiter</CardTitle>
              <p className="text-2xl font-semibold">From ₹4,999<span className="text-sm font-normal">/mo</span></p>
            </CardHeader>
            <CardContent className="space-y-2 text-sm text-muted-foreground">
              <p>• Starter: 3 job posts</p>
              <p>• Pro: 15 job posts, candidate fit scores</p>
              <p>• Enterprise: Unlimited (contact sales)</p>
              <Button asChild variant="outline" className="w-full mt-4">
                <Link href="mailto:sales@ascend.com">Contact Sales</Link>
              </Button>
            </CardContent>
          </Card>
        </div>
        <Card>
          <CardHeader>
            <CardTitle>Mentor marketplace</CardTitle>
            <p className="text-muted-foreground">List your profile and receive paid engagements</p>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-semibold">₹1,199<span className="text-sm font-normal">/month</span> or ₹11,942/year (17% off)</p>
            <Button asChild className="mt-4">
              <Link href="/dashboard/mentor/subscription">Subscribe</Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
