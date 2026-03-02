import { redirect } from "next/navigation";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth/nextauth";
import { ApplyPageClient } from "./ApplyPageClient";

export default async function MentorshipApplyPage({
  params,
}: {
  params: Promise<{ mentorUserId: string }>;
}) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    redirect("/auth/login?callbackUrl=/mentorship");
  }

  const { mentorUserId } = await params;

  return <ApplyPageClient mentorUserId={mentorUserId} />;
}
