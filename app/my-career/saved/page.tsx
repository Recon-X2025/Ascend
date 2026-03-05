import { redirect } from "next/navigation";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth/nextauth";

export default async function SavedPage() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    redirect("/auth/login?callbackUrl=/my-career/saved");
  }
  redirect("/jobs/saved-searches");
}
