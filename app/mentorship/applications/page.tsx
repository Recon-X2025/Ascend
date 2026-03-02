import { redirect } from "next/navigation";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth/nextauth";
import { ApplicationsListClient } from "./ApplicationsListClient";

export default async function MentorshipApplicationsPage() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    redirect("/auth/login?callbackUrl=/mentorship/applications");
  }

  return <ApplicationsListClient />;
}
