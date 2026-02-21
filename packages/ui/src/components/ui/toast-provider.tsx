"use client";

import { Toaster } from "react-hot-toast";

export function ToastProvider() {
  return (
    <Toaster
      position="top-right"
      toastOptions={{
        duration: 4000,
        className: "toast-container",
        style: {
          background: "hsl(var(--background))",
          color: "hsl(var(--foreground))",
          borderRadius: "8px",
          border: "1px solid hsl(var(--border))",
          padding: "12px 16px",
          boxShadow: "0 4px 6px -1px rgba(0, 0, 0, 0.1)",
        },
        success: {
          iconTheme: {
            primary: "hsl(var(--success))",
            secondary: "hsl(var(--success-foreground))",
          },
          style: {
            background: "hsl(var(--success) / 0.1)",
            color: "hsl(var(--success-foreground))",
            border: "1px solid hsl(var(--success) / 0.3)",
          },
        },
        error: {
          iconTheme: {
            primary: "hsl(var(--destructive))",
            secondary: "hsl(var(--destructive-foreground))",
          },
          style: {
            background: "hsl(var(--destructive) / 0.1)",
            color: "hsl(var(--destructive-foreground))",
            border: "1px solid hsl(var(--destructive) / 0.3)",
          },
        },
        loading: {
          iconTheme: {
            primary: "hsl(var(--primary))",
            secondary: "hsl(var(--primary-foreground))",
          },
          style: {
            background: "hsl(var(--muted))",
            color: "hsl(var(--foreground))",
            border: "1px solid hsl(var(--border))",
          },
        },
      }}
    />
  );
}

// Hook for using toast with design tokens
export { toast } from "react-hot-toast";
