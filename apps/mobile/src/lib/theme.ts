export const theme = {
  colors: {
    canvas: "#f4efe7",
    paper: "#fffaf2",
    ink: "#182033",
    muted: "#6d7588",
    border: "#d7cfbf",
    accent: "#f05d23",
    accentSoft: "#ffd7c6",
    ocean: "#0d4c6b",
    mint: "#b8e2cf",
    gold: "#efc14a",
    danger: "#bf3d3d",
    white: "#ffffff",
  },
  radius: {
    sm: 10,
    md: 18,
    lg: 28,
    pill: 999,
  },
  spacing: {
    xs: 6,
    sm: 10,
    md: 16,
    lg: 24,
    xl: 32,
  },
};

export function formatCurrency(value: number | string | null | undefined) {
  const numeric = Number(value ?? 0);
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
  }).format(Number.isFinite(numeric) ? numeric : 0);
}

export function formatRelativeDate(input?: string | null) {
  if (!input) return "Fresh";
  const date = new Date(input);
  if (Number.isNaN(date.getTime())) return "Fresh";
  const delta = Date.now() - date.getTime();
  const minutes = Math.round(delta / 60000);
  if (minutes < 1) return "Just now";
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.round(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.round(hours / 24);
  return `${days}d ago`;
}

export function formatPersonName(first?: string | null, last?: string | null) {
  const full = [first, last].filter(Boolean).join(" ").trim();
  return full || "Unnamed";
}

export function getInitials(label: string) {
  return label
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part.charAt(0).toUpperCase())
    .join("");
}
