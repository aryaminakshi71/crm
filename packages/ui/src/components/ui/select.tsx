"use client";

import * as React from "react";
import { cn } from "../../lib/index";

export interface SelectProps
  extends React.SelectHTMLAttributes<HTMLSelectElement> {
  label?: string;
  error?: string;
  options: { value: string; label: string }[];
  helperText?: string;
}

const Select = React.forwardRef<HTMLSelectElement, SelectProps>(
  ({ className, label, error, options, helperText, id, ...props }, ref) => {
    const selectId = id || props.name;

    return (
      <div className="w-full">
        {label && (
          <label
            htmlFor={selectId}
            className="mb-1 block font-medium text-foreground text-sm"
          >
            {label}
            {props.required && <span className="ml-1 text-destructive">*</span>}
          </label>
        )}
        <select
          id={selectId}
          className={cn(
            "flex h-10 w-full rounded-lg border border-input bg-background px-3 py-2 text-foreground text-sm",
            "focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-0",
            error
              ? "border-destructive focus:border-destructive focus:ring-destructive/20"
              : "focus:border-primary focus:ring-primary/20",
            props.disabled && "cursor-not-allowed bg-muted opacity-50",
            className,
          )}
          ref={ref}
          {...props}
        >
          {options.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
        {error && <p className="mt-1 text-destructive text-sm">{error}</p>}
        {helperText && !error && (
          <p className="mt-1 text-muted-foreground text-sm">{helperText}</p>
        )}
      </div>
    );
  },
);
Select.displayName = "Select";

export { Select };
