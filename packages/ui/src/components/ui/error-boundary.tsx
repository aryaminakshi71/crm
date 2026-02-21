"use client";

import { AlertCircle, Bug, Home, RefreshCw } from "lucide-react";
import React, { Component } from "react";
import type { ErrorInfo, ReactNode } from "react";

interface Props {
  children: ReactNode;
  fallback?: ReactNode | ((error: Error, reset: () => void) => ReactNode);
  onError?: (error: Error, errorInfo: ErrorInfo) => void;
  level?: "page" | "section" | "component";
}

interface State {
  hasError: boolean;
  error: Error | null;
  errorId: string | null;
}

export class ErrorBoundary extends Component<Props, State> {
  state: State = {
    hasError: false,
    error: null,
    errorId: null,
  };

  static getDerivedStateFromError(error: Error): State {
    const errorId = `error-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    return {
      hasError: true,
      error,
      errorId,
    };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error("[ErrorBoundary]", error, errorInfo);
    this.props.onError?.(error, errorInfo);

    if (typeof window !== "undefined") {
      const errorLog = {
        id: this.state.errorId,
        message: error.message,
        stack: error.stack,
        componentStack: errorInfo.componentStack,
        timestamp: new Date().toISOString(),
        url: window.location.href,
        userAgent: navigator.userAgent,
      };

      try {
        if (typeof window !== "undefined") {
          const existingLogs = JSON.parse(
            localStorage.getItem("error-logs") || "[]",
          );
          existingLogs.unshift(errorLog);
          if (existingLogs.length > 50) existingLogs.pop();
          localStorage.setItem("error-logs", JSON.stringify(existingLogs));
        }
      } catch (e) {
        // Ignore storage errors
      }
    }
  }

  handleReset = () => {
    this.setState({ hasError: false, error: null, errorId: null });
  };

  handleReload = () => {
    if (typeof window !== "undefined") {
      window.location.reload();
    }
  };

  handleGoHome = () => {
    if (typeof window !== "undefined") {
      window.location.href = "/";
    }
  };

  handleReportBug = () => {
    if (this.state.error && typeof window !== "undefined") {
      const subject = encodeURIComponent(
        `Bug Report: ${this.state.error.message}`,
      );
      const body = encodeURIComponent(
        `Error ID: ${this.state.errorId}\n` +
          `URL: ${window.location.href}\n` +
          `Error: ${this.state.error.message}\n` +
          `Stack: ${this.state.error.stack || "N/A"}`,
      );
      window.location.href = `mailto:support@example.com?subject=${subject}&body=${body}`;
    }
  };

  render() {
    if (this.state.hasError) {
      if (typeof this.props.fallback === "function") {
        return this.props.fallback(this.state.error!, this.handleReset);
      }

      if (this.props.fallback) {
        return this.props.fallback;
      }

      return (
        <ErrorDisplay
          error={this.state.error}
          errorId={this.state.errorId}
          level={this.props.level}
          onReset={this.handleReset}
          onReload={this.handleReload}
          onGoHome={this.handleGoHome}
          onReportBug={this.handleReportBug}
        />
      );
    }

    return this.props.children;
  }
}

interface ErrorDisplayProps {
  error: Error | null;
  errorId: string | null;
  level: "page" | "section" | "component" | undefined;
  onReset: () => void;
  onReload: () => void;
  onGoHome: () => void;
  onReportBug: () => void;
}

function ErrorDisplay({
  error,
  errorId,
  level,
  onReset,
  onReload,
  onGoHome,
  onReportBug,
}: ErrorDisplayProps) {
  const isPageLevel = level === "page";

  if (isPageLevel) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background p-4">
        <div className="w-full max-w-lg rounded-xl border border-border bg-card p-8 text-center">
          <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-full bg-destructive/10">
            <AlertCircle className="h-8 w-8 text-destructive" />
          </div>
          <h1 className="mb-2 font-bold text-2xl text-card-foreground">
            Something went wrong
          </h1>
          <p className="mb-6 text-muted-foreground">
            We encountered an unexpected error. Please try again or contact
            support if the problem persists.
          </p>
          {errorId && (
            <p className="mb-6 font-mono text-muted-foreground text-xs">
              Error ID: {errorId}
            </p>
          )}
          <div className="flex flex-col justify-center gap-3 sm:flex-row">
            <button
              onClick={onReset}
              className="inline-flex items-center justify-center gap-2 rounded-lg bg-secondary px-4 py-2 text-secondary-foreground transition-colors hover:opacity-90"
            >
              <RefreshCw className="h-4 w-4" />
              Try Again
            </button>
            <button
              onClick={onReload}
              className="inline-flex items-center justify-center gap-2 rounded-lg bg-secondary px-4 py-2 text-secondary-foreground transition-colors hover:opacity-90"
            >
              <RefreshCw className="h-4 w-4" />
              Reload Page
            </button>
            <button
              onClick={onGoHome}
              className="inline-flex items-center justify-center gap-2 rounded-lg bg-primary px-4 py-2 text-primary-foreground transition-colors hover:opacity-90"
            >
              <Home className="h-4 w-4" />
              Go Home
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="rounded-lg border border-destructive/20 bg-destructive/5 p-4">
      <div className="flex items-start gap-3">
        <AlertCircle className="mt-0.5 h-5 w-5 flex-shrink-0 text-destructive" />
        <div className="min-w-0 flex-1">
          <p className="mb-1 font-medium text-destructive text-sm">
            Component Error
          </p>
          <p className="mb-3 text-muted-foreground text-xs">
            {error?.message || "An unexpected error occurred"}
          </p>
          <div className="flex flex-wrap gap-2">
            <button
              onClick={onReset}
              className="inline-flex items-center gap-1 rounded bg-secondary px-2 py-1 text-secondary-foreground text-xs transition-colors hover:opacity-90"
            >
              <RefreshCw className="h-3 w-3" />
              Retry
            </button>
            <button
              onClick={onReportBug}
              className="inline-flex items-center gap-1 rounded bg-secondary px-2 py-1 text-secondary-foreground text-xs transition-colors hover:opacity-90"
            >
              <Bug className="h-3 w-3" />
              Report
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export function withErrorBoundary<P extends object>(
  Component: React.ComponentType<P>,
  options?: Omit<Props, "children">,
): React.ComponentType<P> {
  const WrappedComponent = (props: P) => (
    <ErrorBoundary {...options}>
      <Component {...props} />
    </ErrorBoundary>
  );

  WrappedComponent.displayName = `withErrorBoundary(${Component.displayName || Component.name || "Component"})`;
  return WrappedComponent;
}

export function createErrorBoundary(options?: Omit<Props, "children">) {
  return function ErrorBoundaryWrapper({ children }: { children: ReactNode }) {
    return <ErrorBoundary {...options}>{children}</ErrorBoundary>;
  };
}

interface AsyncErrorBoundaryProps {
  children: ReactNode;
  loading?: ReactNode;
  error?: ReactNode | ((error: Error, retry: () => void) => ReactNode);
  onError?: (error: Error) => void;
}

interface AsyncErrorBoundaryState {
  error: Error | null;
}

export class AsyncErrorBoundary extends Component<
  AsyncErrorBoundaryProps,
  AsyncErrorBoundaryState
> {
  state: AsyncErrorBoundaryState = { error: null };

  static getDerivedStateFromError(error: Error): AsyncErrorBoundaryState {
    return { error };
  }

  componentDidCatch(error: Error) {
    this.props.onError?.(error);
  }

  handleRetry = () => {
    this.setState({ error: null });
  };

  render() {
    if (this.state.error) {
      if (typeof this.props.error === "function") {
        return this.props.error(this.state.error, this.handleRetry);
      }
      if (this.props.error) {
        return this.props.error;
      }
      return (
        <div className="rounded-lg border border-destructive/20 bg-destructive/5 p-4">
          <p className="mb-2 text-destructive text-sm">
            Failed to load content
          </p>
          <button
            onClick={this.handleRetry}
            className="text-primary text-sm hover:opacity-80"
          >
            Try again
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}
