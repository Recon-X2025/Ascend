import { redirect } from "next/navigation";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth/nextauth";
import { prisma } from "@/lib/prisma/client";
import { SavedSearchesList } from "./SavedSearchesList";

export const dynamic = "force-dynamic";

export default async function SavedSearchesPage() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) redirect("/auth/login?callbackUrl=/jobs/saved-searches");

  const list = await prisma.savedSearch.findMany({
    where: { userId: session.user.id },
    orderBy: { createdAt: "desc" },
    select: { id: true, name: true, query: true, filters: true, createdAt: true },
  });

  return (
    <div className="page-container py-8">
      <h1 className="text-2xl font-semibold text-text-primary">Saved searches</h1>
      <p className="mt-1 text-muted-foreground">Quickly re-run a saved search or create an alert.</p>
      <div className="mt-6">
        <SavedSearchesList initialList={list} />
      </div>
    </div>
  );
}
