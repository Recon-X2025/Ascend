"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { AuthCard } from "./AuthCard";
import { OAuthButtons } from "./OAuthButtons";
import { registerSchema, type RegisterFormValues } from "@/lib/validations/auth";

export function RegisterForm() {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
    setValue,
    watch,
  } = useForm<RegisterFormValues>({
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    resolver: zodResolver(registerSchema) as any,
    defaultValues: {
      name: "",
      email: "",
      password: "",
      confirmPassword: "",
      agreeTerms: false,
      marketingConsent: false,
    },
  });

  const agreeTerms = watch("agreeTerms");
  const marketingConsent = watch("marketingConsent");

  const onSubmit = async (data: RegisterFormValues) => {
    setError(null);
    try {
      const res = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: data.name,
          email: data.email,
          password: data.password,
          confirmPassword: data.confirmPassword,
          agreeTerms: true,
          marketingConsent: data.marketingConsent ?? false,
        }),
      });
      let json: { error?: string; data?: { verificationSkipped?: boolean } };
      try {
        json = await res.json();
      } catch {
        setError(res.status === 401 || res.status === 405 ? "Please use the main app URL (no random numbers in it) and ensure Deployment Protection is off." : "Registration failed. Try again.");
        return;
      }
      if (!res.ok) {
        setError(json.error ?? "Registration failed");
        return;
      }
      if (json.data?.verificationSkipped) {
        router.push("/auth/login");
      } else {
        router.push("/auth/verify-email-sent");
      }
      router.refresh();
    } catch {
      setError("Registration failed. Check your connection and try again.");
    }
  };

  return (
    <AuthCard title="Create your account" description="Join Ascend">
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        {error && (
          <p className="ascend-error" role="alert">
            {error}
          </p>
        )}
        <div className="space-y-2">
          <label htmlFor="name" className="ascend-label">Full name</label>
          <Input id="name" placeholder="Jane Doe" autoComplete="name" className="ascend-input" {...register("name")} />
          {errors.name && <p className="ascend-error">{errors.name.message}</p>}
        </div>
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
        <div className="space-y-2">
          <label htmlFor="password" className="ascend-label">Password</label>
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
        <div className="space-y-3 mb-6">
          <label className="flex items-start gap-3 cursor-pointer group">
            <Checkbox
              id="agreeTerms"
              checked={agreeTerms}
              onCheckedChange={(checked) => setValue("agreeTerms", !!checked)}
              className="mt-0.5 h-4 w-4 rounded border-[1.5px] border-border-mid data-[state=checked]:bg-green data-[state=checked]:border-green focus-visible:ring-2 focus-visible:ring-green/15"
            />
            <span className="font-body text-[0.875rem] text-ink-3">
              I agree to Ascend&apos;s{" "}
              <a href="/legal/terms" target="_blank" rel="noopener noreferrer" className="text-green font-medium hover:underline">
                Terms of Service
              </a>{" "}
              and{" "}
              <a href="/legal/privacy" target="_blank" rel="noopener noreferrer" className="text-green font-medium hover:underline">
                Privacy Policy
              </a>
            </span>
          </label>
          {errors.agreeTerms && (
            <p className="text-[0.8125rem]" style={{ color: "var(--red, #DC2626)" }} role="alert">
              {errors.agreeTerms.message}
            </p>
          )}
          <label className="flex items-start gap-3 cursor-pointer">
            <Checkbox
              id="marketingConsent"
              checked={marketingConsent}
              onCheckedChange={(checked) => setValue("marketingConsent", !!checked)}
              className="mt-0.5 h-4 w-4 rounded border-[1.5px] border-border-mid data-[state=checked]:bg-green data-[state=checked]:border-green focus-visible:ring-2 focus-visible:ring-green/15"
            />
            <span className="font-body text-[0.875rem] text-ink-3">
              I&apos;d like to receive career insights, product updates, and tips from Ascend
            </span>
          </label>
        </div>
        <Button type="submit" className="btn-primary w-full" disabled={isSubmitting || !agreeTerms}>
          {isSubmitting ? "Creating account…" : "Create account"}
        </Button>
        <div className="relative my-4">
          <span className="absolute inset-0 flex items-center">
            <span className="w-full border-t border-border" />
          </span>
          <span className="relative flex justify-center text-xs uppercase text-ink-3 bg-surface px-2">
            OR CONTINUE WITH
          </span>
        </div>
        <OAuthButtons />
        <p className="text-center text-sm text-ink-3">
          Already have an account?{" "}
          <Link href="/auth/login" className="font-medium text-green hover:underline">
            Sign in
          </Link>
        </p>
      </form>
    </AuthCard>
  );
}
