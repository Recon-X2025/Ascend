"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { AuthCard } from "./AuthCard";
import { forgotPasswordSchema, type ForgotPasswordInput } from "@/lib/validations/auth";

export function ForgotPasswordForm() {
  const [sent, setSent] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<ForgotPasswordInput>({
    resolver: zodResolver(forgotPasswordSchema),
  });

  const onSubmit = async (data: ForgotPasswordInput) => {
    setError(null);
    const res = await fetch("/api/auth/forgot-password", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email: data.email }),
    });
    const json = await res.json();
    if (!res.ok) {
      setError(json.error ?? "Something went wrong");
      return;
    }
    setSent(true);
  };

  if (sent) {
    return (
      <AuthCard title="Check your email" description="If this email exists, we've sent a reset link.">
        <p className="text-center text-sm text-text-secondary">
          <Link href="/auth/login" className="font-medium text-accent-green hover:underline">
            Back to sign in
          </Link>
        </p>
      </AuthCard>
    );
  }

  return (
    <AuthCard title="Reset your password" description="Enter your email and we'll send a reset link.">
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        {error && (
          <p className="ascend-error" role="alert">
            {error}
          </p>
        )}
        <div className="space-y-2">
          <label htmlFor="email" className="ascend-label">Email</label>
          <Input
            id="email"
            type="email"
            placeholder="you@example.com"
            autoComplete="email"
            className="ascend-input"
            {...register("email")}
          />
          {errors.email && <p className="ascend-error">{errors.email.message}</p>}
        </div>
        <Button type="submit" className="btn-primary w-full" disabled={isSubmitting}>
          {isSubmitting ? "Sending…" : "Send reset link"}
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
