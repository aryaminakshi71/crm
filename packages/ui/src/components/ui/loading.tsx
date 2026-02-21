"use client";
import { cn } from "../../lib/index";

export interface LoadingProps {
  size?: "sm" | "md" | "lg";
  className?: string;
  text?: string;
}

const Loading = ({ size = "md", className, text }: LoadingProps) => {
  const sizeClasses = {
    sm: "h-4 w-4",
    md: "h-8 w-8",
    lg: "h-12 w-12",
  };

  return (
    <div
      className={cn(
        "flex flex-col items-center justify-center gap-2",
        className,
      )}
    >
      <div
        className={cn(
          "animate-spin rounded-full border-2 border-border border-t-blue-600",
          sizeClasses[size],
        )}
      />
      {text && <p className="text-muted-foreground text-sm">{text}</p>}
    </div>
  );
};

export { Loading };
