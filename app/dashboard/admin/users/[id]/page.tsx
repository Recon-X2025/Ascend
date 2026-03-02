import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth/nextauth";
import { redirect } from "next/navigation";
import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma/client";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { formatDistanceToNow } from "date-fns";

export default async function AdminUserDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const session = await getServerSession(authOptions);
  if (!session?.user) redirect("/auth/login");
  if ((session.user as { role?: string }).role !== "PLATFORM_ADMIN") {
    redirect("/dashboard");
  }

  const { id } = await params;

  const user = await prisma.user.findUnique({
    where: { id },
    select: {
      id: true,
      email: true,
      name: true,
      image: true,
      role: true,
      createdAt: true,
      bannedAt: true,
      banReason: true,
      jobSeekerProfile: { select: { completionScore: true, headline: true } },
      jobApplications: {
        orderBy: { submittedAt: "desc" },
        take: 5,
        select: {
          id: true,
          submittedAt: true,
          status: true,
          jobPost: { select: { title: true, slug: true } },
        },
      },
    },
  });

  if (!user) notFound();

  const recentActivity = await prisma.auditLog.findMany({
    where: { targetId: id },
    orderBy: { createdAt: "desc" },
    take: 5,
    select: {
      id: true,
      action: true,
      targetType: true,
      targetLabel: true,
      createdAt: true,
      admin: { select: { name: true, email: true } },
    },
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Link href="/dashboard/admin/users">
          <Button variant="ghost" size="sm">
            ← Back to users
          </Button>
        </Link>
      </div>

      <div className="flex items-start gap-4">
        <Avatar className="h-16 w-16">
          <AvatarImage src={user.image ?? undefined} />
          <AvatarFallback>
            {(user.name || user.email).slice(0, 2).toUpperCase()}
          </AvatarFallback>
        </Avatar>
        <div>
          <h1 className="text-2xl font-bold">{user.name || "—"}</h1>
          <p className="text-muted-foreground">{user.email}</p>
          <div className="flex gap-2 mt-2">
            <Badge variant="secondary">{user.role.replace(/_/g, " ")}</Badge>
            {user.bannedAt ? (
              <Badge variant="destructive">Banned</Badge>
            ) : (
              <Badge variant="outline">Active</Badge>
            )}
          </div>
          <p className="text-sm text-muted-foreground mt-1">
            Joined {formatDistanceToNow(new Date(user.createdAt), { addSuffix: true })}
          </p>
          {user.bannedAt && user.banReason && (
            <p className="text-sm text-destructive mt-1">
              Ban reason: {user.banReason}
            </p>
          )}
        </div>
      </div>

      {user.jobSeekerProfile && (
        <section>
          <h2 className="text-lg font-semibold mb-2">Profile</h2>
          <p className="text-sm text-muted-foreground">
            Completion: {user.jobSeekerProfile.completionScore ?? 0}%
            {user.jobSeekerProfile.headline && ` · ${user.jobSeekerProfile.headline}`}
          </p>
        </section>
      )}

      <section>
        <h2 className="text-lg font-semibold mb-2">Recent applications (5)</h2>
        <ul className="space-y-1 text-sm">
          {user.jobApplications.length === 0 ? (
            <li className="text-muted-foreground">None</li>
          ) : (
            user.jobApplications.map((a) => (
              <li key={a.id}>
                <Link
                  href={`/jobs/${a.jobPost.slug}`}
                  className="text-primary hover:underline"
                >
                  {a.jobPost.title}
                </Link>{" "}
                — {a.status} (
                {formatDistanceToNow(new Date(a.submittedAt), { addSuffix: true })})
              </li>
            ))
          )}
        </ul>
      </section>

      <section>
        <h2 className="text-lg font-semibold mb-2">Recent activity (audit)</h2>
        <ul className="space-y-1 text-sm">
          {recentActivity.length === 0 ? (
            <li className="text-muted-foreground">None</li>
          ) : (
            recentActivity.map((e) => (
              <li key={e.id}>
                <span className="font-medium">{e.action}</span> —{" "}
                {e.admin?.name || e.admin?.email || "—"} ·{" "}
                {formatDistanceToNow(new Date(e.createdAt), { addSuffix: true })}
              </li>
            ))
          )}
        </ul>
      </section>
    </div>
  );
}
