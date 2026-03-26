import { cn } from "@/lib/utils";

type PresenceStatus = "online" | "away" | "offline";

const config: Record<PresenceStatus, { color: string; label: string }> = {
  online: { color: "bg-green-500", label: "Online" },
  away: { color: "bg-yellow-400", label: "Away" },
  offline: { color: "bg-gray-400", label: "Offline" },
};

interface OnlineIndicatorProps {
  status: PresenceStatus;
  className?: string;
  showLabel?: boolean;
}

export function OnlineIndicator({ status, className, showLabel }: OnlineIndicatorProps) {
  const { color, label } = config[status] ?? config.offline;
  return (
    <span className={cn("inline-flex items-center gap-1.5", className)}>
      <span
        className={cn(
          "inline-block h-2 w-2 rounded-full ring-2 ring-background",
          color,
        )}
        aria-label={label}
      />
      {showLabel && (
        <span className="text-xs text-muted-foreground">{label}</span>
      )}
    </span>
  );
}
