import * as React from "react";
import { cn } from "@/lib/utils";

export interface SectionLabelProps extends React.HTMLAttributes<HTMLSpanElement> {
  withDash?: boolean;
}

function SectionLabel({ className, withDash, children, ...props }: SectionLabelProps) {
  return (
    <span
      className={cn(
        "font-body text-[0.68rem] sm:text-[0.7rem] tracking-[0.22em] uppercase text-green",
        className
      )}
      {...props}
    >
      {withDash ? "── " : null}
      {children}
    </span>
  );
}

export { SectionLabel };
