"use client";

import { cn } from "../../lib/index";

export interface SkeletonProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: "text" | "circular" | "rectangular";
  width?: string | number;
  height?: string | number;
  animation?: "pulse" | "wave" | "none";
}

/**
 * LoadingSkeleton component for consistent loading states
 * Uses design tokens for theming
 */
export function LoadingSkeleton({
  className,
  variant = "rectangular",
  width,
  height,
  animation = "pulse",
  style,
  ...props
}: SkeletonProps) {
  const baseStyles = {
    width: width
      ? typeof width === "number"
        ? `${width}px`
        : width
      : undefined,
    height: height
      ? typeof height === "number"
        ? `${height}px`
        : height
      : undefined,
    ...style,
  };

  return (
    <div
      className={cn(
        "bg-muted",
        variant === "circular" && "rounded-full",
        variant === "text" && "rounded",
        variant === "rectangular" && "rounded-lg",
        animation === "pulse" && "animate-pulse",
        animation === "wave" && "animate-shimmer",
        className,
      )}
      style={baseStyles}
      {...props}
    />
  );
}

/**
 * SkeletonText - Multiple lines of text skeleton
 */
export function SkeletonText({
  lines = 3,
  className,
  ...props
}: {
  lines?: number;
  className?: string;
} & React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div className={cn("space-y-2", className)} {...props}>
      {Array.from({ length: lines }).map((_, i) => (
        <LoadingSkeleton
          key={i}
          variant="text"
          height={16}
          width={i === lines - 1 ? "75%" : "100%"}
        />
      ))}
    </div>
  );
}

/**
 * SkeletonCard - Card-shaped skeleton
 */
export function SkeletonCard({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn(
        "space-y-4 rounded-lg border border-border bg-card p-6",
        className,
      )}
      {...props}
    >
      <LoadingSkeleton variant="rectangular" height={24} width="60%" />
      <SkeletonText lines={3} />
      <div className="flex gap-2">
        <LoadingSkeleton variant="rectangular" height={36} width={100} />
        <LoadingSkeleton variant="rectangular" height={36} width={100} />
      </div>
    </div>
  );
}

/**
 * SkeletonTable - Table-shaped skeleton
 */
export function SkeletonTable({
  rows = 5,
  columns = 4,
  className,
  ...props
}: {
  rows?: number;
  columns?: number;
  className?: string;
} & React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div className={cn("space-y-2", className)} {...props}>
      {/* Header */}
      <div className="flex gap-4 border-border border-b pb-2">
        {Array.from({ length: columns }).map((_, i) => (
          <LoadingSkeleton
            key={i}
            variant="rectangular"
            height={20}
            width="100%"
          />
        ))}
      </div>
      {/* Rows */}
      {Array.from({ length: rows }).map((_, rowIdx) => (
        <div key={rowIdx} className="flex gap-4 py-2">
          {Array.from({ length: columns }).map((_, colIdx) => (
            <LoadingSkeleton
              key={colIdx}
              variant="rectangular"
              height={16}
              width="100%"
            />
          ))}
        </div>
      ))}
    </div>
  );
}

/**
 * SkeletonStatGrid - 4-stat grid matching dashboard patterns
 */
export function SkeletonStatGrid({
  count = 4,
  className,
  ...props
}: {
  count?: number;
  className?: string;
} & React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div className={cn("grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4", className)} {...props}>
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="space-y-3 rounded-lg border border-border bg-card p-6">
          <div className="flex items-center justify-between">
            <LoadingSkeleton variant="text" height={14} width="50%" />
            <LoadingSkeleton variant="circular" height={32} width={32} />
          </div>
          <LoadingSkeleton variant="text" height={28} width="70%" />
          <LoadingSkeleton variant="text" height={12} width="40%" />
        </div>
      ))}
    </div>
  );
}

/**
 * SkeletonListPage - Header + table pattern for list views
 */
export function SkeletonListPage({
  rows = 8,
  className,
  ...props
}: {
  rows?: number;
  className?: string;
} & React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div className={cn("space-y-4", className)} {...props}>
      <div className="flex items-center justify-between">
        <LoadingSkeleton variant="text" height={28} width={200} />
        <LoadingSkeleton variant="rectangular" height={36} width={120} />
      </div>
      <div className="flex gap-2">
        <LoadingSkeleton variant="rectangular" height={36} width={240} />
        <LoadingSkeleton variant="rectangular" height={36} width={120} />
      </div>
      <SkeletonTable rows={rows} columns={5} />
    </div>
  );
}
