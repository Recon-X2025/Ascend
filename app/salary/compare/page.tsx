"use client";

import { useState } from "react";
import Link from "next/link";
import { Container } from "@/components/layout/Container";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { CityComparisonTable } from "@/components/salary/CityComparisonTable";
import { PremiumGate } from "@/components/shared/PremiumGate";

const MAX_CITIES = 5;

export default function SalaryComparePage() {
  const [role, setRole] = useState("");
  const [citiesInput, setCitiesInput] = useState("");
  const [comparison, setComparison] = useState<
    { city: string; median: number; costIndex: number | null; adjustedMedian: number }[]
  >([]);
  const [loading, setLoading] = useState(false);
  const [allowed, setAllowed] = useState<boolean | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [upgradeRequired, setUpgradeRequired] = useState(false);

  const handleCompare = async () => {
    const cityList = citiesInput
      .split(",")
      .map((c) => c.trim())
      .filter(Boolean)
      .slice(0, MAX_CITIES);
    if (!role.trim() || cityList.length === 0) {
      setError("Enter a role and at least one city (comma-separated, max 5).");
      return;
    }
    setLoading(true);
    setError(null);
    setComparison([]);
    try {
      const res = await fetch(
        `/api/salary/city-comparison?role=${encodeURIComponent(role.trim())}&cities=${encodeURIComponent(cityList.join(","))}`
      );
      const data = await res.json();
      if (res.status === 403 && data.upgradeRequired) {
        setAllowed(false);
        setUpgradeRequired(true);
        return;
      }
      setUpgradeRequired(false);
      if (!res.ok) {
        setError(data.error || "Failed to load comparison");
        return;
      }
      setAllowed(true);
      setComparison(data.comparison ?? []);
    } catch {
      setError("Something went wrong. Try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-bg min-h-screen">
      <Container className="py-8">
        <div className="mb-6">
          <Link href="/salary" className="text-sm text-green-dark hover:underline">
            ← Salary Insights
          </Link>
        </div>

        <header className="mb-8">
          <h1 className="text-2xl font-display font-semibold text-ink">City salary comparison</h1>
          <p className="text-ink-2 mt-1 text-sm">
            Compare median salary and purchasing power across cities. Premium feature.
          </p>
        </header>

        <div className="rounded-xl border border-amber-200 bg-amber-50 dark:bg-amber-950/20 p-4 mb-6">
          <p className="text-sm text-amber-800 dark:text-amber-200">
            This tool is available for Premium subscribers.{" "}
            <Link href="/dashboard/billing/upgrade" className="font-medium underline">
              Upgrade to Premium
            </Link>
          </p>
        </div>

        <div className="max-w-xl space-y-4 mb-8">
          <div>
            <Label htmlFor="compare-role">Role</Label>
            <Input
              id="compare-role"
              placeholder="e.g. Software Engineer"
              value={role}
              onChange={(e) => setRole(e.target.value)}
              className="mt-1"
            />
          </div>
          <div>
            <Label htmlFor="compare-cities">Cities (comma-separated, max 5)</Label>
            <Input
              id="compare-cities"
              placeholder="e.g. Bangalore, Mumbai, Delhi, Hyderabad, Pune"
              value={citiesInput}
              onChange={(e) => setCitiesInput(e.target.value)}
              className="mt-1"
            />
          </div>
          <Button variant="primary" onClick={handleCompare} disabled={loading}>
            {loading ? "Comparing…" : "Compare"}
          </Button>
        </div>

        {upgradeRequired && (
          <p className="text-sm text-amber-700 dark:text-amber-300 mb-4">
            Upgrade to Premium to compare salaries across cities.
          </p>
        )}
        {error && <p className="text-sm text-red-600 mb-4">{error}</p>}

        {comparison.length > 0 && (
          <PremiumGate feature="salary_city_comparison" allowed={allowed ?? false}>
            <CityComparisonTable rows={comparison} />
          </PremiumGate>
        )}
      </Container>
    </div>
  );
}
