// Button Component - Based on existing shared-ui patterns

import { Slot } from "@radix-ui/react-slot";
import { type VariantProps, cva } from "class-variance-authority";
import * as React from "react";
import { cn } from "../../lib/index";

const buttonVariants = cva(
  "inline-flex items-center justify-center whitespace-nowrap rounded-lg text-sm font-medium transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50",
  {
    variants: {
      variant: {
        primary:
          "bg-primary dark:bg-primary text-primary-foreground hover:bg-primary/90 dark:hover:bg-primary/90 focus-visible:ring-ring dark:focus-visible:ring-ring",
        secondary:
          "bg-secondary dark:bg-secondary  text-secondary-foreground hover:bg-secondary/80 dark:hover:bg-secondary/80 focus-visible:ring-ring dark:focus-visible:ring-ring",
        outline:
          "border border-border dark:border-border bg-card dark:bg-foreground/90 text-foreground dark:text-muted-foreground hover:bg-muted dark:hover:bg-muted focus-visible:ring-ring dark:focus-visible:ring-ring",
        ghost:
          "text-muted-foreground dark:text-muted-foreground hover:bg-muted dark:hover:bg-muted hover:text-foreground dark:hover:text-background focus-visible:ring-ring dark:focus-visible:ring-ring",
        danger:
          "bg-destructive dark:bg-destructive  text-destructive-foreground hover:bg-destructive dark:hover:bg-destructive focus-visible:ring-destructive/50 dark:focus-visible:ring-destructive/50",
        success:
          "bg-success dark:bg-success  text-success-foreground hover:bg-success dark:hover:bg-success focus-visible:ring-success/50 dark:focus-visible:ring-success/50",
        warning:
          "bg-warning dark:bg-warning  text-warning-foreground hover:bg-warning dark:hover:bg-warning focus-visible:ring-warning/50 dark:focus-visible:ring-warning/50",
        link: "text-primary dark:text-primary underline-offset-4 hover:underline",
      },
      size: {
        xs: "h-7 px-2 text-xs",
        sm: "h-8 px-3 text-xs",
        md: "h-10 px-4 py-2",
        lg: "h-12 px-8 text-lg",
        xl: "h-14 px-10 text-xl",
        icon: "h-10 w-10",
      },
    },
    defaultVariants: {
      variant: "primary",
      size: "md",
    },
  },
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean;
  loading?: boolean;
  isLoading?: boolean; // Alias for loading (for backward compatibility)
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      className,
      variant,
      size,
      asChild = false,
      loading,
      isLoading,
      leftIcon,
      rightIcon,
      children,
      disabled,
      "aria-label": ariaLabel,
      ...props
    },
    ref,
  ) => {
    // Use isLoading as fallback if loading is not provided
    const isLoadingState = loading ?? isLoading ?? false;
    const Comp = asChild ? Slot : "button";
    const isIconOnly = !children && (leftIcon || rightIcon);
    const computedAriaLabel = isIconOnly
      ? ariaLabel || (leftIcon ? "Action" : "Action")
      : ariaLabel;

    // Filter out custom props that shouldn't be passed to DOM elements
    const domProps = Object.fromEntries(
      Object.entries(props).filter(
        ([key]) =>
          ![
            "loading",
            "isLoading",
            "leftIcon",
            "rightIcon",
            "variant",
            "size",
            "asChild",
          ].includes(key),
      ),
    );

    return (
      <Comp
        className={cn(buttonVariants({ variant, size }), className)}
        ref={ref}
        disabled={disabled || isLoadingState}
        aria-label={computedAriaLabel}
        aria-disabled={disabled || isLoadingState ? "true" : undefined}
        aria-busy={isLoadingState ? "true" : undefined}
        {...domProps}
      >
        {isLoadingState ? (
          <>
            <svg
              className="mr-2 h-4 w-4 animate-spin"
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
              aria-hidden="true"
            >
              <circle
                className="opacity-25"
                cx="12"
                cy="12"
                r="10"
                stroke="currentColor"
                strokeWidth="4"
              />
              <path
                className="opacity-75"
                fill="currentColor"
                d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
              />
            </svg>
            <span className="sr-only">Loading...</span>
          </>
        ) : (
          <>
            {leftIcon && (
              <span className="mr-2" aria-hidden="true">
                {leftIcon}
              </span>
            )}
            {children}
            {rightIcon && (
              <span className="ml-2" aria-hidden="true">
                {rightIcon}
              </span>
            )}
          </>
        )}
      </Comp>
    );
  },
);
Button.displayName = "Button";

export { Button, buttonVariants };
