import { cn } from "@/lib/utils";
import { ChevronLeft, ChevronRight } from "lucide-react";

interface PaginationProps {
  page: number;
  totalPages: number;
  onPageChange: (page: number) => void;
  className?: string;
}

export function Pagination({ page, totalPages, onPageChange, className }: PaginationProps) {
  if (totalPages <= 1) return null;
  const pages = Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
    if (totalPages <= 5) return i + 1;
    if (page <= 3) return i + 1;
    if (page >= totalPages - 2) return totalPages - 4 + i;
    return page - 2 + i;
  });
  return (
    <div className={cn("flex items-center justify-center gap-1 py-4", className)}>
      <button disabled={page === 1} onClick={() => onPageChange(page - 1)} className="rounded-md border px-2 py-1.5 text-sm text-muted-foreground hover:bg-muted disabled:opacity-40 disabled:cursor-not-allowed">
        <ChevronLeft className="h-4 w-4" />
      </button>
      {pages[0] > 1 && <><span className="px-2 py-1 text-sm text-muted-foreground">1</span><span className="text-muted-foreground">…</span></>}
      {pages.map(p => (
        <button key={p} onClick={() => onPageChange(p)} className={cn("min-w-[32px] rounded-md border px-2 py-1 text-sm", p === page ? "bg-primary text-primary-foreground border-primary" : "text-muted-foreground hover:bg-muted")}>
          {p}
        </button>
      ))}
      {pages[pages.length - 1] < totalPages && <><span className="text-muted-foreground">…</span><span className="px-2 py-1 text-sm text-muted-foreground">{totalPages}</span></>}
      <button disabled={page === totalPages} onClick={() => onPageChange(page + 1)} className="rounded-md border px-2 py-1.5 text-sm text-muted-foreground hover:bg-muted disabled:opacity-40 disabled:cursor-not-allowed">
        <ChevronRight className="h-4 w-4" />
      </button>
    </div>
  );
}
