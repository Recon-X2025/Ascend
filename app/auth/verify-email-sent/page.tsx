"use client";

import { Suspense, useState } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { AuthCard } from "@/components/auth/AuthCard";

function VerifyEmailSentContent() {
  const searchParams = useSearchParams();
  const email = searchParams.get("email") ?? "";
  const [resending, setResending] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  const handleResend = async () => {
    const toSend =
      email ||
      (typeof window !== "undefined"
        ? (document.getElementById("resend-email") as HTMLInputElement)?.value
        : "");
    if (!toSend) {
      setMessage("Enter your email to resend.");
      return;
    }
    setResending(true);
    setMessage(null);
    const res = await fetch("/api/auth/resend-verification", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email: toSend }),
    });
    const json = await res.json();
    setResending(false);
    if (res.status === 429)
      setMessage("Please wait 1 minute before requesting another email.");
    else if (json.success) setMessage("Verification email sent.");
    else setMessage(json.error ?? "Failed to send.");
  };

  return (
    <AuthCard title="Check your inbox" description="We've sent you a verification link.">
      <p className="text-center text-sm text-text-secondary">
        Click the link in the email to verify your account. It may take a few minutes to arrive.
      </p>
      {!email && (
        <input
          id="resend-email"
          type="email"
          placeholder="Your email"
          className="ascend-input mt-2"
        />
      )}
      <Button
        type="button"
        variant="outline"
        className="btn-secondary w-full mt-4"
        onClick={handleResend}
        disabled={resending}
      >
        {resending ? "Sending…" : "Resend email"}
      </Button>
      {message && (
        <p className="mt-2 text-center text-sm text-text-secondary">{message}</p>
      )}
      <p className="mt-4 text-center text-sm text-text-secondary">
        <Link href="/auth/login" className="font-medium text-accent-green hover:underline">
          Back to sign in
        </Link>
      </p>
    </AuthCard>
  );
}

export default function VerifyEmailSentPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-surface px-4 py-8">
      <Suspense fallback={<div className="h-64 w-full max-w-md animate-pulse rounded-xl bg-muted" />}>
        <VerifyEmailSentContent />
      </Suspense>
    </div>
  );
}
