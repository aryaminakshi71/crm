import { ErrorBoundary } from "@crm/ui";
import type { ReactNode } from "react";

interface ErrorBoundaryWrapperProps {
  children: ReactNode;
  fallback?: ReactNode;
}

export function ErrorBoundaryWrapper({
  children,
  fallback,
}: ErrorBoundaryWrapperProps) {
  const defaultFallback = (
    <div className="flex min-h-screen items-center justify-center bg-muted p-4">
      <div className="w-full max-w-md rounded-lg bg-card p-6 shadow-lg">
        <h1 className="mb-4 font-bold text-2xl text-destructive">
          Something went wrong
        </h1>
        <p className="mb-4 text-foreground">
          An unexpected error occurred. Please refresh the page or contact
          support if the problem persists.
        </p>
        <button
          onClick={() => window.location.reload()}
          className="rounded bg-primary px-4 py-2 text-primary-foreground hover:bg-primary/90"
        >
          Refresh Page
        </button>
      </div>
    </div>
  );

  return (
    <ErrorBoundary fallback={fallback || defaultFallback}>
      {children}
    </ErrorBoundary>
  );
}
