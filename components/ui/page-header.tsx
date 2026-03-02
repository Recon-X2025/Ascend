import * as React from "react";
import { cn } from "@/lib/utils";

export interface PageHeaderProps extends Omit<React.HTMLAttributes<HTMLDivElement>, "title"> {
  title: React.ReactNode;
  subtitle?: React.ReactNode;
  right?: React.ReactNode;
}

function PageHeader({ className, title, subtitle, right, ...props }: PageHeaderProps) {
  return (
    <div className={cn("border-b border-border pb-6 mb-8", className)} {...props}>
      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
        <div>
          <h1 className="font-display font-bold text-2xl text-ink">{title}</h1>
          {subtitle != null && (
            <p className="font-body text-[0.9rem] text-ink-2 mt-1">{subtitle}</p>
          )}
        </div>
        {right != null ? <div className="shrink-0">{right}</div> : null}
      </div>
    </div>
  );
}

export { PageHeader };
