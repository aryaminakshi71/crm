import type { ReactNode } from "react";
import { Button } from "./button";
import { Card } from "./card";

interface EmptyStateProps {
  icon?: ReactNode;
  title: string;
  description?: string;
  action?: {
    label: string;
    onClick: () => void;
  };
  className?: string;
}

export function EmptyState({
  icon,
  title,
  description,
  action,
  className,
}: EmptyStateProps) {
  return (
    <Card className={`p-8 text-center ${className || ""}`}>
      {icon && <div className="mx-auto mb-4">{icon}</div>}
      <h3 className="mb-2 font-semibold text-foreground text-lg">{title}</h3>
      {description && (
        <p className="mb-4 text-muted-foreground">{description}</p>
      )}
      {action && <Button onClick={action.onClick}>{action.label}</Button>}
    </Card>
  );
}
