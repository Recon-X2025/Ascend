import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth/nextauth";
import { redirect } from "next/navigation";
import { MentorshipOpsClient } from "@/components/dashboard/admin/MentorshipOpsClient";

export default async function AdminMentorshipOpsPage() {
  const session = await getServerSession(authOptions);
  if (!session) redirect("/auth/login");
  if ((session.user as { role?: string }).role !== "PLATFORM_ADMIN") {
    redirect("/dashboard");
  }
  return <MentorshipOpsClient />;
}
