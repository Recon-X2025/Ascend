import * as React from "react";
import { cn } from "@/lib/utils";

export interface EmptyStateProps extends Omit<React.HTMLAttributes<HTMLDivElement>, "title"> {
  icon?: React.ReactNode;
  title: React.ReactNode;
  message?: React.ReactNode;
  action?: React.ReactNode;
}

function EmptyState({
  className,
  icon,
  title,
  message,
  action,
  ...props
}: EmptyStateProps) {
  return (
    <div
      className={cn(
        "flex flex-col items-center justify-center py-12 px-4 text-center",
        className
      )}
      {...props}
    >
      {icon && (
        <div className="w-8 h-8 text-ink-3 flex items-center justify-center [&_svg]:w-8 [&_svg]:h-8">
          {icon}
        </div>
      )}
      <h3 className="font-display font-semibold text-base text-ink mt-3">{title}</h3>
      {message && (
        <p className="font-body text-[0.85rem] text-ink-2 mt-1 max-w-[320px]">
          {message}
        </p>
      )}
      {action && <div className="mt-4">{action}</div>}
    </div>
  );
}

export { EmptyState };
