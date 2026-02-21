"use client";
import { cn } from "../../lib/index";

export interface ProgressBarProps {
  value: number;
  max?: number;
  className?: string;
  showLabel?: boolean;
}

const ProgressBar = ({
  value,
  max = 100,
  className,
  showLabel = false,
}: ProgressBarProps) => {
  const percentage = Math.min(Math.max((value / max) * 100, 0), 100);

  return (
    <div className={cn("w-full", className)}>
      <div className="h-2 w-full overflow-hidden rounded-full bg-muted">
        <div
          className="h-full bg-primary transition-all duration-300"
          style={{ width: `${percentage}%` }}
        />
      </div>
      {showLabel && (
        <p className="mt-1 text-muted-foreground text-sm">
          {Math.round(percentage)}%
        </p>
      )}
    </div>
  );
};

export { ProgressBar };
