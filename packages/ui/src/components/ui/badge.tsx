// Badge Component - Based on existing shared-ui patterns

import { type VariantProps, cva } from "class-variance-authority";
import * as React from "react";
import { cn } from "../../lib/index";

const badgeVariants = cva(
  "inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2",
  {
    variants: {
      variant: {
        default: "bg-muted text-foreground",
        primary: "bg-primary/10 text-primary",
        secondary: "bg-muted text-foreground",
        success: "bg-success/15 text-success",
        warning: "bg-warning/15 text-warning",
        danger: "bg-destructive/10 text-destructive",
        info: "bg-primary/10 text-primary",
        outline: "border border-border text-foreground",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  },
);

export interface BadgeProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof badgeVariants> {
  size?: "sm" | "md";
}

function Badge({ className, variant, size = "md", ...props }: BadgeProps) {
  const sizes = {
    sm: "px-2 py-0.5 text-xs",
    md: "px-2.5 py-1 text-sm",
  };

  return (
    <div
      className={cn(badgeVariants({ variant }), sizes[size], className)}
      {...props}
    />
  );
}

export { Badge, badgeVariants };
