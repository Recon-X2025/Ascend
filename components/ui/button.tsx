import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-lg text-sm font-medium transition-all duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-green focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-40 [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0",
  {
    variants: {
      variant: {
        default:
          "bg-green text-white hover:bg-green-dark shadow-sm",
        primary:
          "bg-green text-white hover:bg-green-dark shadow-sm",
        ghost:
          "border border-border-mid bg-transparent text-ink-2 hover:border-green hover:text-green",
        destructive:
          "border border-red-600 bg-transparent text-red-600 hover:bg-red-600/5",
        outline:
          "border border-border-mid bg-surface text-ink-2 hover:border-green hover:text-green",
        secondary:
          "border border-border bg-surface text-ink-2 hover:bg-surface-2",
        link: "text-green underline-offset-4 hover:text-green-dark",
        white:
          "bg-white text-green-dark shadow-[0_4px_20px_rgba(0,0,0,0.15)] hover:bg-green-light",
      },
      size: {
        default: "h-10 px-4 py-2",
        sm: "h-[34px] rounded-lg px-3 text-xs",
        lg: "h-12 px-6 text-base",
        icon: "h-10 w-10",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean;
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : "button";
    return (
      <Comp
        className={cn(buttonVariants({ variant, size, className }))}
        ref={ref}
        {...props}
      />
    );
  }
);
Button.displayName = "Button";

export { Button, buttonVariants };
