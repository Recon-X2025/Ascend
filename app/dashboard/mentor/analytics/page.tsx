import { redirect } from "next/navigation";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth/nextauth";
import { prisma } from "@/lib/prisma/client";
import { MentorAnalyticsClient } from "@/components/mentorship/mentor-dashboard/MentorAnalyticsClient";

export default async function MentorAnalyticsPage() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    redirect("/auth/login?callbackUrl=/dashboard/mentor/analytics");
  }

  const profile = await prisma.mentorProfile.findUnique({
    where: { userId: session.user.id },
    select: { id: true },
  });
  if (!profile) {
    redirect("/mentorship/become-a-mentor");
  }

  return <MentorAnalyticsClient />;
}
