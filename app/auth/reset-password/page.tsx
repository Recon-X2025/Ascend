import { Suspense } from "react";
import { ResetPasswordForm } from "@/components/auth/ResetPasswordForm";

export default function ResetPasswordPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-surface px-4 py-8">
      <Suspense fallback={<div className="h-64 w-full max-w-md animate-pulse rounded-xl bg-muted" />}>
        <ResetPasswordForm />
      </Suspense>
    </div>
  );
}
