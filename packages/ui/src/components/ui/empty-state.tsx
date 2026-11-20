import type { ReactNode } from "react";
import { Card } from "./card";

interface EmptyStateProps {
  icon?: ReactNode;
  title: string;
  description?: string;
  action?: ReactNode;
  className?: string;
  variant?: "default" | "error";
}

export function EmptyState({
  icon,
  title,
  description,
  action,
  className,
  variant = "default",
}: EmptyStateProps) {
  return (
    <Card
      className={`p-8 text-center ${variant === "error" ? "border-destructive/20 bg-destructive/5" : ""} ${className || ""}`}
    >
      {icon && <div className="mx-auto mb-4">{icon}</div>}
      <h3 className={`mb-2 font-semibold text-lg ${variant === "error" ? "text-destructive" : "text-foreground"}`}>
        {title}
      </h3>
      {description && (
        <p className="mb-4 text-muted-foreground text-sm">{description}</p>
      )}
      {action && <div className="mt-4">{action}</div>}
    </Card>
  );
}
