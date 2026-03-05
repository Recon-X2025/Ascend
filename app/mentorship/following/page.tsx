import { redirect } from "next/navigation";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth/nextauth";
import { getFollowingMentors } from "@/lib/mentorship/follow";
import { FollowingListClient } from "./FollowingListClient";

export default async function FollowingPage() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    redirect("/auth/login?callbackUrl=/mentorship/following");
  }

  const following = await getFollowingMentors(session.user.id);

  return (
    <div className="page-container py-8">
      <h1 className="text-2xl font-semibold text-text-primary">Following</h1>
      <p className="mt-1 text-muted-foreground">
        Mentors you follow. Their posts will appear in your feed when that feature launches.
      </p>
      <div className="mt-6">
        <FollowingListClient initialList={following} />
      </div>
    </div>
  );
}
