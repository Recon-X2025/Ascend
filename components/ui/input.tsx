import * as React from "react";
import { cn } from "@/lib/utils";

const Input = React.forwardRef<HTMLInputElement, React.ComponentProps<"input">>(
  ({ className, type, ...props }, ref) => {
    return (
      <input
        type={type}
        className={cn(
          "flex h-[42px] min-h-[42px] w-full rounded-lg border border-border bg-bg px-3 py-2 text-[0.875rem] text-ink placeholder:text-ink-5 transition-colors",
          "focus:outline-none focus:border-green focus:ring-[3px] focus:ring-green/10",
          "disabled:cursor-not-allowed disabled:opacity-50",
          "data-[error=true]:border-red-500",
          className
        )}
        ref={ref}
        {...props}
      />
    );
  }
);
Input.displayName = "Input";

export { Input };
