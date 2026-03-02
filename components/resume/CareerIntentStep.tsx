"use client";

import { useCallback, useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  careerIntentSchema,
  type CareerIntentInput,
  targetLevelValues,
} from "@/lib/validations/career-intent";
import { INDUSTRIES, INDUSTRY_OTHER } from "@/lib/resume/industries";
import { cn } from "@/lib/utils";

const TARGET_LEVEL_LABELS: Record<(typeof targetLevelValues)[number], string> = {
  IC: "IC",
  TEAM_LEAD: "Team Lead",
  MANAGER: "Manager",
  DIRECTOR: "Director",
  VP: "VP",
  C_SUITE: "C-Suite",
};

const CAREER_GOAL_MAX = 300;

interface CareerIntentStepProps {
  defaultValues?: Partial<CareerIntentInput>;
  onSaveDraft: (data: CareerIntentInput) => Promise<void>;
  onContinue: (data: CareerIntentInput) => void;
  isSubmitting: boolean;
}

export function CareerIntentStep({
  defaultValues,
  onSaveDraft,
  onContinue,
  isSubmitting,
}: CareerIntentStepProps) {
  const [roleSuggestions, setRoleSuggestions] = useState<string[]>([]);
  const [roleSuggestionsOpen, setRoleSuggestionsOpen] = useState(false);
  const [industrySelect, setIndustrySelect] = useState<string>(() => {
    const v = defaultValues?.targetIndustry?.trim();
    if (!v) return "";
    return INDUSTRIES.includes(v as (typeof INDUSTRIES)[number]) ? v : INDUSTRY_OTHER;
  });
  const [otherIndustry, setOtherIndustry] = useState(() => {
    const v = defaultValues?.targetIndustry?.trim();
    if (!v || INDUSTRIES.includes(v as (typeof INDUSTRIES)[number])) return "";
    return v;
  });

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors },
  } = useForm<CareerIntentInput>({
    resolver: zodResolver(careerIntentSchema),
    defaultValues: {
      targetRole: defaultValues?.targetRole ?? "",
      targetIndustry: defaultValues?.targetIndustry ?? "",
      targetLevel: defaultValues?.targetLevel ?? "IC",
      careerGoal: defaultValues?.careerGoal ?? "",
      switchingIndustry: defaultValues?.switchingIndustry ?? false,
      fromIndustry: defaultValues?.fromIndustry ?? null,
      toIndustry: defaultValues?.toIndustry ?? null,
    },
  });

  const targetRole = watch("targetRole");
  const switchingIndustry = watch("switchingIndustry");
  const careerGoal = watch("careerGoal");

  // Sync industry field: either selected or "Other" typed value
  useEffect(() => {
    if (industrySelect === INDUSTRY_OTHER && otherIndustry.trim()) {
      setValue("targetIndustry", otherIndustry.trim());
    } else if (industrySelect && industrySelect !== INDUSTRY_OTHER) {
      setValue("targetIndustry", industrySelect);
    }
  }, [industrySelect, otherIndustry, setValue]);

  // Fetch job title suggestions (debounced)
  useEffect(() => {
    if (!targetRole || targetRole.length < 2) {
      setRoleSuggestions([]);
      return;
    }
    const t = setTimeout(async () => {
      try {
        const res = await fetch(`/api/resume/job-titles?q=${encodeURIComponent(targetRole)}`);
        const json = await res.json();
        if (json.success && Array.isArray(json.data)) setRoleSuggestions(json.data);
        else setRoleSuggestions([]);
      } catch {
        setRoleSuggestions([]);
      }
    }, 200);
    return () => clearTimeout(t);
  }, [targetRole]);

  const onSelectRole = useCallback(
    (title: string) => {
      setValue("targetRole", title);
      setRoleSuggestionsOpen(false);
    },
    [setValue]
  );

  const onSubmit = (data: CareerIntentInput) => {
    const industry =
      industrySelect === INDUSTRY_OTHER ? otherIndustry.trim() : industrySelect;
    if (industry) (data as CareerIntentInput).targetIndustry = industry;
    onContinue(data);
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      {/* Target role with autocomplete */}
      <div className="space-y-2">
        <Label htmlFor="targetRole" className="ascend-label">
          What role are you targeting?
        </Label>
        <div className="relative">
          <Input
            id="targetRole"
            placeholder="e.g. Product Manager"
            className="ascend-input"
            autoComplete="off"
            {...register("targetRole")}
            onFocus={() => targetRole.length >= 2 && setRoleSuggestionsOpen(true)}
            onBlur={() => setTimeout(() => setRoleSuggestionsOpen(false), 150)}
          />
          {roleSuggestionsOpen && roleSuggestions.length > 0 && (
            <ul
              className="absolute z-10 mt-1 w-full rounded-md border bg-popover py-1 shadow-md"
              role="listbox"
            >
              {roleSuggestions.map((title) => (
                <li
                  key={title}
                  role="option"
                  aria-selected={targetRole === title}
                  tabIndex={0}
                  className="cursor-pointer px-3 py-2 text-sm hover:bg-accent"
                  onMouseDown={(e) => {
                    e.preventDefault();
                    onSelectRole(title);
                  }}
                >
                  {title}
                </li>
              ))}
            </ul>
          )}
        </div>
        {errors.targetRole && (
          <p className="ascend-error">{errors.targetRole.message}</p>
        )}
      </div>

      {/* Industry */}
      <div className="space-y-2">
        <Label className="ascend-label">What industry?</Label>
        <Select
          value={industrySelect || undefined}
          onValueChange={(v) => {
            setIndustrySelect(v);
            if (v !== INDUSTRY_OTHER) setValue("targetIndustry", v);
          }}
        >
          <SelectTrigger className="ascend-input">
            <SelectValue placeholder="Select industry" />
          </SelectTrigger>
          <SelectContent>
            {INDUSTRIES.map((ind) => (
              <SelectItem key={ind} value={ind}>
                {ind === INDUSTRY_OTHER ? "Other (type your own)" : ind}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        {industrySelect === INDUSTRY_OTHER && (
          <Input
            placeholder="Type your industry"
            className="ascend-input mt-2"
            value={otherIndustry}
            onChange={(e) => setOtherIndustry(e.target.value)}
          />
        )}
        {errors.targetIndustry && (
          <p className="ascend-error">{errors.targetIndustry.message}</p>
        )}
      </div>

      {/* Level */}
      <div className="space-y-2">
        <Label className="ascend-label">What level?</Label>
        <div className="flex flex-wrap gap-3" role="radiogroup" aria-label="Target level">
          {targetLevelValues.map((level) => (
            <label
              key={level}
              className={cn(
                "flex cursor-pointer items-center gap-2 rounded-md border px-3 py-2 text-sm transition-colors",
                "border-input hover:bg-accent/50",
                watch("targetLevel") === level && "border-accent-green bg-accent-green/10 ring-1 ring-accent-green"
              )}
            >
              <input
                type="radio"
                value={level}
                className="sr-only"
                {...register("targetLevel")}
              />
              {TARGET_LEVEL_LABELS[level]}
            </label>
          ))}
        </div>
        {errors.targetLevel && (
          <p className="ascend-error">{errors.targetLevel.message}</p>
        )}
      </div>

      {/* Career goal */}
      <div className="space-y-2">
        <Label htmlFor="careerGoal" className="ascend-label">
          What is your primary career goal?
        </Label>
        <textarea
          id="careerGoal"
          maxLength={CAREER_GOAL_MAX}
          placeholder="e.g. Lead product strategy for a global SaaS product"
          className="ascend-input min-h-[100px] w-full resize-y px-3 py-2"
          {...register("careerGoal")}
        />
        <p className="text-right text-xs text-muted-foreground">
          {careerGoal?.length ?? 0}/{CAREER_GOAL_MAX}
        </p>
        {errors.careerGoal && (
          <p className="ascend-error">{errors.careerGoal.message}</p>
        )}
      </div>

      {/* Switching industries */}
      <div className="space-y-2">
        <div className="flex items-center gap-2">
          <Checkbox
            id="switchingIndustry"
            checked={switchingIndustry}
            onCheckedChange={(checked) =>
              setValue("switchingIndustry", Boolean(checked))
            }
          />
          <Label htmlFor="switchingIndustry" className="cursor-pointer text-sm">
            Are you switching industries?
          </Label>
        </div>
        {switchingIndustry && (
          <div className="mt-3 grid gap-3 sm:grid-cols-2">
            <div className="space-y-1">
              <Label className="ascend-label">Switching from</Label>
              <Input
                placeholder="e.g. Finance"
                className="ascend-input"
                {...register("fromIndustry")}
              />
              {errors.fromIndustry && (
                <p className="ascend-error">{errors.fromIndustry.message}</p>
              )}
            </div>
            <div className="space-y-1">
              <Label className="ascend-label">Switching to</Label>
              <Input
                placeholder="e.g. Technology"
                className="ascend-input"
                {...register("toIndustry")}
              />
              {errors.toIndustry && (
                <p className="ascend-error">{errors.toIndustry.message}</p>
              )}
            </div>
          </div>
        )}
      </div>

      <div className="flex flex-wrap items-center justify-between gap-4 pt-4">
        <Button
          type="button"
          variant="outline"
          disabled={isSubmitting}
          onClick={handleSubmit(async (data) => {
            const industry =
              industrySelect === INDUSTRY_OTHER
                ? otherIndustry.trim()
                : industrySelect;
            if (industry) (data as CareerIntentInput).targetIndustry = industry;
            await onSaveDraft(data as CareerIntentInput);
          })}
        >
          Save as draft
        </Button>
        <Button type="submit" className="btn-primary" disabled={isSubmitting}>
          {isSubmitting ? "Saving…" : "Continue →"}
        </Button>
      </div>
    </form>
  );
}
