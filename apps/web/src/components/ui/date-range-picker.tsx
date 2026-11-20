import { useState } from "react";
import { Button } from "@crm/ui";
import { Calendar, ChevronDown } from "lucide-react";

type Preset = "today" | "7d" | "30d" | "90d" | "ytd" | "custom";

interface DateRange {
  from: Date;
  to: Date;
  preset: Preset;
}

const PRESETS: { value: Preset; label: string }[] = [
  { value: "today", label: "Today" },
  { value: "7d", label: "Last 7 days" },
  { value: "30d", label: "Last 30 days" },
  { value: "90d", label: "Last 90 days" },
  { value: "ytd", label: "Year to date" },
];

function presetToRange(preset: Preset): { from: Date; to: Date } {
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  switch (preset) {
    case "today": return { from: today, to: now };
    case "7d": return { from: new Date(today.getTime() - 7 * 864e5), to: now };
    case "30d": return { from: new Date(today.getTime() - 30 * 864e5), to: now };
    case "90d": return { from: new Date(today.getTime() - 90 * 864e5), to: now };
    case "ytd": return { from: new Date(now.getFullYear(), 0, 1), to: now };
    default: return { from: today, to: now };
  }
}

export function DateRangePicker({
  value,
  onChange,
  className,
}: {
  value?: DateRange;
  onChange: (range: DateRange) => void;
  className?: string;
}) {
  const [open, setOpen] = useState(false);
  const current = value ?? { ...presetToRange("30d"), preset: "30d" as Preset };
  const label = PRESETS.find((p) => p.value === current.preset)?.label ??
    `${current.from.toLocaleDateString()} – ${current.to.toLocaleDateString()}`;

  return (
    <div className={`relative ${className ?? ""}`}>
      <Button
        variant="outline"
        size="sm"
        onClick={() => setOpen((v) => !v)}
        className="gap-2"
      >
        <Calendar className="h-3.5 w-3.5" />
        {label}
        <ChevronDown className="h-3.5 w-3.5" />
      </Button>
      {open && (
        <div className="absolute right-0 top-full z-50 mt-1 w-48 rounded-lg border border-border bg-card shadow-lg py-1">
          {PRESETS.map((p) => (
            <button
              key={p.value}
              type="button"
              onClick={() => {
                onChange({ ...presetToRange(p.value), preset: p.value });
                setOpen(false);
              }}
              className={`w-full px-3 py-2 text-left text-sm transition-colors hover:bg-muted/60 ${
                current.preset === p.value ? "text-primary font-medium" : "text-foreground"
              }`}
            >
              {p.label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

export { type DateRange, type Preset };
