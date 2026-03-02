import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const badgeVariants = cva(
  "inline-flex items-center rounded-full border px-2.5 py-0.5 text-[0.7rem] font-medium",
  {
    variants: {
      variant: {
        default: "border-green-mid bg-green-light text-green-dark",
        green: "border-green-mid bg-green-light text-green-dark",
        dim: "border-border bg-surface-2 text-ink-3",
        red: "border-red-500/20 bg-red-500/10 text-red-600",
        outline: "border-border text-ink-2",
        secondary: "border-border bg-surface-2 text-ink-3",
        destructive: "border-red-500/20 bg-red-500/10 text-red-600",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  }
);

export interface BadgeProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof badgeVariants> {}

function Badge({ className, variant, ...props }: BadgeProps) {
  return <div className={cn(badgeVariants({ variant }), className)} {...props} />;
}

export { Badge, badgeVariants };
