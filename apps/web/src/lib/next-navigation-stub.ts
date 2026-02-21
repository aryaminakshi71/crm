// Stub for next/navigation to prevent Next.js from being bundled
import { useNavigate, useSearch } from "@tanstack/react-router";

export function useRouter() {
  const navigate = useNavigate();
  return {
    push: (path: string) => navigate({ to: path }),
    replace: (path: string) => navigate({ to: path, replace: true }),
    back: () => window.history.back(),
    forward: () => window.history.forward(),
    refresh: () => window.location.reload(),
  };
}

export function useSearchParams() {
  const search = useSearch({ strict: false });
  return {
    get: (key: string) => {
      const params = search as Record<string, unknown>;
      return params[key] as string | null;
    },
    getAll: (key: string) => {
      const params = search as Record<string, unknown>;
      const value = params[key];
      return value ? [String(value)] : [];
    },
    has: (key: string) => {
      const params = search as Record<string, unknown>;
      return key in params;
    },
    keys: () => {
      const params = search as Record<string, unknown>;
      return Object.keys(params);
    },
    values: () => {
      const params = search as Record<string, unknown>;
      return Object.values(params).map(String);
    },
    entries: () => {
      const params = search as Record<string, unknown>;
      return Object.entries(params).map(([k, v]) => [k, String(v)]);
    },
    forEach: (callback: (value: string, key: string) => void) => {
      const params = search as Record<string, unknown>;
      Object.entries(params).forEach(([k, v]) => callback(String(v), k));
    },
    toString: () => {
      const params = search as Record<string, unknown>;
      return new URLSearchParams(
        Object.entries(params).reduce(
          (acc, [k, v]) => {
            acc[k] = String(v);
            return acc;
          },
          {} as Record<string, string>,
        ),
      ).toString();
    },
  };
}

export function usePathname() {
  // This would need the actual pathname from TanStack Router
  return typeof window !== "undefined" ? window.location.pathname : "/";
}
