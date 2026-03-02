"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { recruiterOnboardingSchema, type RecruiterOnboardingInput } from "@/lib/validations/auth";

const COMPANY_SIZES = ["1-10", "11-50", "51-200", "201-500", "501-1000", "1000+"];

interface RecruiterStepProps {
  defaultName?: string;
  onSubmit: (data: RecruiterOnboardingInput) => void;
  isSubmitting: boolean;
}

export function RecruiterStep({ defaultName = "", onSubmit, isSubmitting }: RecruiterStepProps) {
  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors },
  } = useForm<RecruiterOnboardingInput>({
    resolver: zodResolver(recruiterOnboardingSchema),
    defaultValues: { name: defaultName },
  });
  const companySizeValue = watch("companySize");

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      <div className="space-y-2">
        <label htmlFor="name" className="ascend-label">Full name</label>
        <Input id="name" placeholder="Jane Doe" className="ascend-input" {...register("name")} />
        {errors.name && <p className="ascend-error">{errors.name.message}</p>}
      </div>
      <div className="space-y-2">
        <label htmlFor="companyName" className="ascend-label">Company name</label>
        <Input id="companyName" placeholder="Acme Inc." className="ascend-input" {...register("companyName")} />
        {errors.companyName && <p className="ascend-error">{errors.companyName.message}</p>}
      </div>
      <div className="space-y-2">
        <label htmlFor="designation" className="ascend-label">Your designation</label>
        <Input
          id="designation"
          placeholder="e.g. HR Manager, Talent Acquisition Lead"
          className="ascend-input"
          {...register("designation")}
        />
        {errors.designation && <p className="ascend-error">{errors.designation.message}</p>}
      </div>
      <div className="space-y-2">
        <label className="ascend-label">Company size</label>
        <Select value={companySizeValue} onValueChange={(v) => setValue("companySize", v)}>
          <SelectTrigger className="ascend-input">
            <SelectValue placeholder="Select size" />
          </SelectTrigger>
          <SelectContent>
            {COMPANY_SIZES.map((size) => (
              <SelectItem key={size} value={size}>
                {size} employees
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        {errors.companySize && (
          <p className="ascend-error">{errors.companySize.message}</p>
        )}
      </div>
      <Button type="submit" className="btn-primary w-full" disabled={isSubmitting}>
        {isSubmitting ? "Saving…" : "Continue"}
      </Button>
    </form>
  );
}
