import { useEffect } from "react";
import { useNavigate } from "@tanstack/react-router";

interface Shortcut {
  key: string;
  meta?: boolean;
  shift?: boolean;
  description: string;
  action: () => void;
}

export function useKeyboardShortcuts() {
  const navigate = useNavigate();

  const shortcuts: Shortcut[] = [
    { key: "g", description: "Go to Dashboard", action: () => navigate({ to: "/app" }) },
    { key: "g", shift: true, description: "Go to CRM", action: () => navigate({ to: "/app/crm/contacts" as any }) },
    { key: "g", meta: true, description: "Go to Projects", action: () => navigate({ to: "/app/projects" as any }) },
    { key: "i", meta: true, description: "Go to Invoices", action: () => navigate({ to: "/app/invoicing/invoices" as any }) },
    { key: "h", meta: true, description: "Go to Helpdesk", action: () => navigate({ to: "/app/helpdesk/tickets" as any }) },
    { key: "Escape", description: "Close modals / go back", action: () => {} },
  ];

  useEffect(() => {
    let gPressed = false;
    let gTimer: ReturnType<typeof setTimeout>;

    function handleKeyDown(e: KeyboardEvent) {
      const tag = (e.target as HTMLElement)?.tagName;
      if (["INPUT", "TEXTAREA", "SELECT"].includes(tag)) return;
      if ((e.target as HTMLElement)?.isContentEditable) return;

      // Two-key "g then x" sequences
      if (gPressed) {
        gPressed = false;
        clearTimeout(gTimer);
        if (e.key === "c") navigate({ to: "/app/crm/contacts" as any });
        if (e.key === "p") navigate({ to: "/app/projects" as any });
        if (e.key === "i") navigate({ to: "/app/invoicing/invoices" as any });
        if (e.key === "h") navigate({ to: "/app/helpdesk/tickets" as any });
        if (e.key === "d") navigate({ to: "/app" as any });
        if (e.key === "a") navigate({ to: "/app/agents" as any });
        return;
      }

      if (e.key === "g" && !e.metaKey && !e.ctrlKey && !e.altKey) {
        gPressed = true;
        gTimer = setTimeout(() => { gPressed = false; }, 1000);
        return;
      }

      // Single-key shortcuts with modifiers
      if ((e.metaKey || e.ctrlKey) && e.key === "k") return; // let command palette handle
    }

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [navigate]);

  return shortcuts;
}
