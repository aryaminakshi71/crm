import * as React from "react";
import { cn } from "../../lib/index";

export interface TerminalProps extends React.HTMLAttributes<HTMLDivElement> {
  title?: string;
}

const Terminal = React.forwardRef<HTMLDivElement, TerminalProps>(
  ({ className, title, children, ...props }, ref) => {
    return (
      <div
        ref={ref}
        className={cn(
          "rounded-lg border border-border bg-card text-card-foreground overflow-hidden",
          className
        )}
        {...props}
      >
        {title && (
          <div className="border-b border-border bg-muted px-4 py-2">
            <div className="flex items-center gap-2">
              <div className="flex gap-1.5">
                <div className="h-3 w-3 rounded-full bg-red-500" />
                <div className="h-3 w-3 rounded-full bg-yellow-500" />
                <div className="h-3 w-3 rounded-full bg-green-500" />
              </div>
              <span className="text-xs text-muted-foreground">{title}</span>
            </div>
          </div>
        )}
        <div className="p-4 font-mono text-sm">{children}</div>
      </div>
    );
  }
);
Terminal.displayName = "Terminal";

export { Terminal };
