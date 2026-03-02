"use client";

import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { signIn } from "next-auth/react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { AuthCard } from "./AuthCard";
import { OAuthButtons } from "./OAuthButtons";
import { loginSchema, type LoginFormValues } from "@/lib/validations/auth";

export function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const callbackUrl = searchParams.get("callbackUrl") ?? "/dashboard";
  const [error, setError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
    setValue,
    watch,
  } = useForm<LoginFormValues>({
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    resolver: zodResolver(loginSchema) as any,
    defaultValues: { email: "", password: "", remember: false },
  });
  const remember = watch("remember");

  const onSubmit = async (data: LoginFormValues) => {
    setError(null);
    if (data.remember) {
      document.cookie = "ascend_remember=1; path=/; max-age=2592000"; // 30 days
    } else {
      document.cookie = "ascend_remember=; path=/; max-age=0";
    }
    const res = await signIn("credentials", {
      email: data.email,
      password: data.password,
      redirect: false,
    });
    if (res?.error) {
      setError("Invalid email or password");
      return;
    }
    if (res?.ok) {
      router.push(callbackUrl);
      router.refresh();
    }
  };

  return (
    <AuthCard title="Welcome back" description="Sign in to your account">
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
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <label htmlFor="password" className="ascend-label">Password</label>
            <Link href="/auth/forgot-password" className="text-xs text-green hover:underline">
              Forgot password?
            </Link>
          </div>
          <Input
            id="password"
            type="password"
            autoComplete="current-password"
            className="ascend-input"
            {...register("password")}
          />
          {errors.password && <p className="ascend-error">{errors.password.message}</p>}
        </div>
        <div className="flex items-center space-x-2">
          <Checkbox
            id="remember"
            checked={remember}
            onCheckedChange={(checked) => setValue("remember", !!checked)}
          />
          <Label htmlFor="remember" className="text-sm font-normal cursor-pointer text-ink-3">
            Remember me
          </Label>
        </div>
        <Button type="submit" className="btn-primary w-full" disabled={isSubmitting}>
          {isSubmitting ? "Signing in…" : "Sign in"}
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
          Don&apos;t have an account?{" "}
          <Link href="/auth/register" className="font-medium text-green hover:underline">
            Register
          </Link>
        </p>
      </form>
    </AuthCard>
  );
}
