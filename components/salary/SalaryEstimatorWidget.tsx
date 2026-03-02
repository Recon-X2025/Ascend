"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { formatSalaryLPA } from "@/lib/salary/format";
import { cn } from "@/lib/utils";

const schema = z.object({
  role: z.string().min(1, "Role is required"),
  city: z.string().min(1, "City is required"),
  yearsExp: z.coerce.number().min(0).max(40),
  companyType: z.string().optional(),
});

type FormData = {
  role: string;
  city: string;
  yearsExp: number;
  companyType?: string;
};

interface SalaryEstimatorWidgetProps {
  /** Pre-filled role from page context */
  defaultRole?: string;
  defaultCity?: string;
  /** Whether user has premium (full range + confidence) */
  hasPremium?: boolean;
  className?: string;
}

export function SalaryEstimatorWidget({
  defaultRole = "",
  defaultCity = "",
  hasPremium = false,
  className,
}: SalaryEstimatorWidgetProps) {
  const [result, setResult] = useState<{
    estimate: number;
    range?: { low: number; high: number };
    confidence: string;
    dataPoints: number;
    communityCount?: number;
    jdSignalCount?: number;
  } | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<FormData>({
    resolver: zodResolver(schema) as import("react-hook-form").Resolver<FormData>,
    defaultValues: {
      role: defaultRole,
      city: defaultCity,
      yearsExp: 5,
    },
  });

  const onSubmit = async (data: FormData) => {
    setLoading(true);
    setError(null);
    setResult(null);
    try {
      const res = await fetch("/api/salary/estimate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          role: data.role,
          city: data.city,
          yearsExp: data.yearsExp,
          companyType: data.companyType || undefined,
        }),
      });
      const json = await res.json();
      if (!res.ok) {
        setError(json.error || "Failed to get estimate");
        return;
      }
      setResult({
        estimate: json.estimate,
        range: json.range,
        confidence: json.confidence,
        dataPoints: json.dataPoints,
        communityCount: json.communityCount,
        jdSignalCount: json.jdSignalCount,
      });
    } catch {
      setError("Something went wrong. Try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card className={className}>
      <CardHeader className="pb-2">
        <h3 className="font-semibold text-ink">Salary estimator</h3>
      </CardHeader>
      <CardContent className="space-y-4">
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-3">
          <div>
            <Label htmlFor="est-role">Role</Label>
            <Input
              id="est-role"
              placeholder="e.g. Software Engineer"
              {...register("role")}
              className="mt-1"
            />
            {errors.role && (
              <p className="text-xs text-red-600 mt-0.5">{errors.role.message}</p>
            )}
          </div>
          <div>
            <Label htmlFor="est-city">City</Label>
            <Input
              id="est-city"
              placeholder="e.g. Bangalore"
              {...register("city")}
              className="mt-1"
            />
            {errors.city && (
              <p className="text-xs text-red-600 mt-0.5">{errors.city.message}</p>
            )}
          </div>
          <div>
            <Label htmlFor="est-exp">Years of experience</Label>
            <Input
              id="est-exp"
              type="number"
              min={0}
              max={40}
              {...register("yearsExp")}
              className="mt-1"
            />
          </div>
          <Button type="submit" variant="primary" className="w-full" disabled={loading}>
            {loading ? "Estimating…" : "Estimate my salary"}
          </Button>
        </form>

        {error && (
          <p className="text-sm text-red-600">{error}</p>
        )}

        {result && (
          <div className="rounded-lg bg-surface-2 p-4 space-y-2 border border-border">
            <p className="text-lg font-semibold text-green-dark">
              {formatSalaryLPA(result.estimate)}
            </p>
            {hasPremium && result.range && (
              <p className="text-sm text-ink-2">
                Range: {formatSalaryLPA(result.range.low)} – {formatSalaryLPA(result.range.high)}
              </p>
            )}
            <p className="text-xs text-ink-3">
              Based on {result.dataPoints} data points
              {hasPremium && result.communityCount != null && result.jdSignalCount != null && (
                <> · {result.communityCount} community + {result.jdSignalCount} job postings</>
              )}
            </p>
            {hasPremium && (
              <span
                className={cn(
                  "inline-block text-xs font-medium px-2 py-0.5 rounded",
                  result.confidence === "high" && "bg-green/15 text-green-dark",
                  result.confidence === "medium" && "bg-amber-100 text-amber-800",
                  result.confidence === "low" && "bg-surface-2 text-ink-3"
                )}
              >
                Confidence: {result.confidence}
              </span>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
