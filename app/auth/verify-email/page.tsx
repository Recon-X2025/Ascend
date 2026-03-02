import { redirect } from "next/navigation";
import Link from "next/link";
import { prisma } from "@/lib/prisma/client";
import { Button } from "@/components/ui/button";
import { AuthCard } from "@/components/auth/AuthCard";

export default async function VerifyEmailPage({
  searchParams,
}: {
  searchParams: Promise<{ token?: string }>;
}) {
  const { token } = await searchParams;
  if (!token) {
    return (
      <div className="flex min-h-[calc(100vh-8rem)] flex-col items-center justify-center px-4 py-8">
        <AuthCard title="Invalid link" description="This verification link is invalid or expired.">
          <Link href="/auth/verify-email-sent">
            <Button variant="outline" className="w-full">
              Request new link
            </Button>
          </Link>
        </AuthCard>
      </div>
    );
  }
  const record = await prisma.verificationToken.findUnique({
    where: { token },
  });
  if (!record || record.expires < new Date()) {
    return (
      <div className="flex min-h-[calc(100vh-8rem)] flex-col items-center justify-center px-4 py-8">
        <AuthCard title="Link expired or invalid" description="This verification link has expired.">
          <Link href="/auth/verify-email-sent">
            <Button variant="outline" className="w-full">
              Resend verification email
            </Button>
          </Link>
        </AuthCard>
      </div>
    );
  }
  await prisma.$transaction([
    prisma.user.update({
      where: { email: record.identifier },
      data: { emailVerified: new Date() },
    }),
    prisma.verificationToken.delete({ where: { token } }),
  ]);
  redirect("/onboarding/persona");
}
