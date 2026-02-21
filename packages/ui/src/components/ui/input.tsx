// Input Component - Based on existing shared-ui patterns

import * as React from "react";
import { cn } from "../../lib/index";

export interface InputProps
  extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  helperText?: string;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
}

const Input = React.forwardRef<HTMLInputElement, InputProps>(
  (
    {
      className,
      type,
      label,
      error,
      helperText,
      leftIcon,
      rightIcon,
      id,
      ...props
    },
    ref,
  ) => {
    const inputId = id || props.name;
    const errorId = error ? `${inputId}-error` : undefined;
    const helperId = helperText ? `${inputId}-helper` : undefined;

    return (
      <div className="w-full">
        {label && (
          <label
            htmlFor={inputId}
            className="mb-1 block font-medium text-foreground text-sm"
            id={`${inputId}-label`}
          >
            {label}
            {props.required && (
              <span className="ml-1 text-destructive" aria-label="required">
                *
              </span>
            )}
          </label>
        )}
        <div className="relative">
          {leftIcon && (
            <div
              className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3 text-muted-foreground"
              aria-hidden="true"
            >
              {leftIcon}
            </div>
          )}
          <input
            type={type}
            id={inputId}
            className={cn(
              "flex h-10 w-full rounded-lg border border-input bg-background px-3 py-2 text-foreground text-sm placeholder:text-muted-foreground",
              "focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-0",
              error
                ? "border-destructive focus:border-destructive focus:ring-destructive/20"
                : "focus:border-primary focus:ring-primary/20",
              leftIcon && "pl-10",
              rightIcon && "pr-10",
              props.disabled && "cursor-not-allowed bg-muted opacity-50",
              className,
            )}
            ref={ref}
            aria-invalid={error ? "true" : undefined}
            aria-describedby={errorId || helperId || undefined}
            aria-labelledby={`${inputId}-label`}
            aria-required={props.required ? "true" : undefined}
            {...props}
          />
          {rightIcon && (
            <div
              className="absolute inset-y-0 right-0 flex items-center pr-3 text-muted-foreground"
              aria-hidden="true"
            >
              {rightIcon}
            </div>
          )}
        </div>
        {error && (
          <p
            id={errorId}
            className="mt-1 text-destructive text-sm"
            role="alert"
          >
            {error}
          </p>
        )}
        {helperText && !error && (
          <p id={helperId} className="mt-1 text-muted-foreground text-sm">
            {helperText}
          </p>
        )}
      </div>
    );
  },
);
Input.displayName = "Input";

export { Input };
