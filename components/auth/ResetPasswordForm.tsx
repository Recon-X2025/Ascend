"use client";

import { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { AuthCard } from "./AuthCard";
import { resetPasswordSchema, type ResetPasswordInput } from "@/lib/validations/auth";

export function ResetPasswordForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = searchParams.get("token");
  const [error, setError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<ResetPasswordInput>({
    resolver: zodResolver(resetPasswordSchema),
  });

  useEffect(() => {
    if (!token) setError("Invalid or missing reset link.");
  }, [token]);

  const onSubmit = async (data: ResetPasswordInput) => {
    setError(null);
    const res = await fetch("/api/auth/reset-password", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        token,
        password: data.password,
        confirmPassword: data.confirmPassword,
      }),
    });
    const json = await res.json();
    if (!res.ok) {
      setError(json.error ?? "Failed to update password");
      return;
    }
    router.push("/auth/login");
    router.refresh();
  };

  if (!token) {
    return (
      <AuthCard title="Reset password" description="Link invalid or expired.">
        <p className="text-center text-sm text-text-secondary">
          <Link href="/auth/forgot-password" className="font-medium text-accent-green hover:underline">
            Request a new link
          </Link>
        </p>
      </AuthCard>
    );
  }

  return (
    <AuthCard title="Set a new password" description="Enter your new password below.">
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        {error && (
          <p className="ascend-error" role="alert">
            {error}
          </p>
        )}
        <div className="space-y-2">
          <label htmlFor="password" className="ascend-label">New password</label>
          <Input
            id="password"
            type="password"
            autoComplete="new-password"
            placeholder="Min 8 chars, 1 uppercase, 1 number"
            className="ascend-input"
            {...register("password")}
          />
          {errors.password && <p className="ascend-error">{errors.password.message}</p>}
        </div>
        <div className="space-y-2">
          <label htmlFor="confirmPassword" className="ascend-label">Confirm password</label>
          <Input
            id="confirmPassword"
            type="password"
            autoComplete="new-password"
            className="ascend-input"
            {...register("confirmPassword")}
          />
          {errors.confirmPassword && (
            <p className="ascend-error">{errors.confirmPassword.message}</p>
          )}
        </div>
        <Button type="submit" className="btn-primary w-full" disabled={isSubmitting}>
          {isSubmitting ? "Updating…" : "Update password"}
        </Button>
        <p className="text-center text-sm text-text-secondary">
          <Link href="/auth/login" className="font-medium text-accent-green hover:underline">
            Back to sign in
          </Link>
        </p>
      </form>
    </AuthCard>
  );
}
