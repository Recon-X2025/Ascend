import { Suspense } from "react";
import { LoginForm } from "@/components/auth/LoginForm";

export default function LoginPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-bg px-4 py-8">
      <Suspense fallback={<div className="h-64 w-full max-w-md animate-pulse rounded-2xl bg-surface-2" />}>
        <LoginForm />
      </Suspense>
    </div>
  );
}
