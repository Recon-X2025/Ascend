import Link from "next/link";
import { Button } from "@/components/ui/button";
import { AuthCard } from "@/components/auth/AuthCard";

export default async function AuthErrorPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const { error } = await searchParams;
  const message =
    error === "OAuthAccountNotLinked"
      ? "This email is already registered with another sign-in method. Sign in with the method you used originally."
      : error === "OAuthCallbackError"
      ? "Sign-in with this provider failed. Please try again or use another sign-in method."
      : error === "AccessDenied"
      ? "Access was denied. You may have cancelled sign-in or the app may not have permission."
      : error === "CredentialsSignin"
      ? "Invalid email or password."
      : "An error occurred during sign-in.";

  return (
    <div className="flex min-h-[calc(100vh-8rem)] flex-col items-center justify-center px-4 py-8">
      <AuthCard title="Sign-in error" description={message}>
        <Link href="/auth/login">
          <Button className="w-full">Try again</Button>
        </Link>
      </AuthCard>
    </div>
  );
}
