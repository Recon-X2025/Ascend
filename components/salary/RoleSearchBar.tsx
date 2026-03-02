"use client";

import { useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { Search } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { roleToSlug } from "@/lib/salary/normalize";
import { cn } from "@/lib/utils";

interface RoleSearchBarProps {
  defaultRole?: string;
  defaultCity?: string;
  placeholder?: string;
  className?: string;
}

export function RoleSearchBar({
  defaultRole = "",
  defaultCity = "",
  placeholder = "Job title or role",
  className,
}: RoleSearchBarProps) {
  const router = useRouter();
  const [role, setRole] = useState(defaultRole);
  const [city, setCity] = useState(defaultCity);

  const handleSearch = useCallback(() => {
    const q = new URLSearchParams();
    if (role.trim()) q.set("role", role.trim());
    if (city.trim()) q.set("city", city.trim());
    if (role.trim()) {
      const slug = roleToSlug(role.trim());
      router.push(`/salary/roles/${slug}?${q.toString()}`);
    } else {
      router.push(`/salary?${q.toString()}`);
    }
  }, [role, city, router]);

  return (
    <div className={cn("flex flex-col sm:flex-row gap-2", className)}>
      <div className="relative flex-1">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-ink-3" />
        <Input
          type="search"
          placeholder={placeholder}
          value={role}
          onChange={(e) => setRole(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && handleSearch()}
          className="pl-9"
        />
      </div>
      <Input
        placeholder="City (optional)"
        value={city}
        onChange={(e) => setCity(e.target.value)}
        onKeyDown={(e) => e.key === "Enter" && handleSearch()}
        className="sm:w-40"
      />
      <Button variant="primary" onClick={handleSearch}>
        Explore salaries
      </Button>
    </div>
  );
}
