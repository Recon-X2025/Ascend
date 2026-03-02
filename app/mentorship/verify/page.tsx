import { redirect } from "next/navigation";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth/nextauth";
import { prisma } from "@/lib/prisma/client";
import { VerifyClient } from "./VerifyClient";

export default async function MentorVerifyPage() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    redirect("/auth/login?callbackUrl=/mentorship/verify");
  }

  const mentorProfile = await prisma.mentorProfile.findUnique({
    where: { userId: session.user.id },
  });
  if (!mentorProfile) {
    redirect("/mentorship/become-mentor");
  }

  return <VerifyClient />;
}
