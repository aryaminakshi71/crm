import { LoadingSkeleton, SkeletonStatGrid, SkeletonTable as BaseSkeletonTable } from "@crm/ui";

// Re-export base table skeleton with cols alias to match the @crm/ui API (columns)
export function SkeletonTable({ rows = 5, cols = 4 }: { rows?: number; cols?: number }) {
  return (
    <div className="space-y-3 p-4">
      <div className="flex gap-4">
        {Array.from({ length: cols }).map((_, i) => (
          <LoadingSkeleton key={i} variant="rectangular" height={16} width="100%" />
        ))}
      </div>
      {Array.from({ length: rows }).map((_, i) => (
        <div key={i} className="flex gap-4">
          {Array.from({ length: cols }).map((_, j) => (
            <LoadingSkeleton key={j} variant="rectangular" height={32} width="100%" />
          ))}
        </div>
      ))}
    </div>
  );
}

export function SkeletonCards({ count = 3 }: { count?: number }) {
  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="rounded-lg border p-4 space-y-3">
          <LoadingSkeleton variant="text" height={16} width="75%" />
          <LoadingSkeleton variant="text" height={12} width="50%" />
          <LoadingSkeleton variant="rectangular" height={32} width="100%" />
        </div>
      ))}
    </div>
  );
}

export function SkeletonStats({ count = 4 }: { count?: number }) {
  return <SkeletonStatGrid count={count} />;
}
