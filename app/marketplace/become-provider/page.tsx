import { redirect } from "next/navigation";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth/nextauth";
import { prisma } from "@/lib/prisma/client";
import { BecomeProviderClient } from "./BecomeProviderClient";

export default async function BecomeProviderPage() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    redirect("/auth/login?callbackUrl=/marketplace/become-provider");
  }

  const existing = await prisma.marketplaceProvider.findUnique({
    where: { userId: session.user.id },
  });
  if (existing?.status === "ACTIVE") {
    redirect("/dashboard/provider");
  }

  return (
    <div className="min-h-screen bg-[var(--bg)] px-4 py-8">
      <div className="max-w-2xl mx-auto">
        <h1 className="font-display font-extrabold text-2xl text-ink mb-2">Become a marketplace provider</h1>
        <p className="text-muted-foreground mb-8">
          Offer resume reviews, mock interviews, or career coaching. We will review your application within 48 hours.
        </p>
        <BecomeProviderClient existing={existing ? { id: existing.id, status: existing.status } : null} />
      </div>
    </div>
  );
}
