import { useNavigate } from "@tanstack/react-router";
import { Command } from "cmdk";
import {
  BarChart3,
  Home,
  LogIn,
  Search,
  Settings,
  UserPlus,
  Users,
} from "lucide-react";
import { useEffect, useState } from "react";

interface CommandPaletteProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function CommandPalette({ open, onOpenChange }: CommandPaletteProps) {
  const navigate = useNavigate();
  const [search, setSearch] = useState("");

  useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if (e.key === "k" && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        onOpenChange(!open);
      }
      if (e.key === "Escape") {
        onOpenChange(false);
      }
    };
    document.addEventListener("keydown", down);
    return () => document.removeEventListener("keydown", down);
  }, [open, onOpenChange]);

  const runCommand = (command: () => void) => {
    command();
    onOpenChange(false);
    setSearch("");
  };

  const nav = (to: string) => {
    navigate({ to });
  };

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-start justify-center bg-black/50 pt-[20vh]"
      onClick={() => onOpenChange(false)}
    >
      <Command
        className="w-full max-w-2xl overflow-hidden rounded-lg border border-border bg-card shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center border-border border-b px-4">
          <Search className="mr-2 h-5 w-5 text-muted-foreground" />
          <Command.Input
            placeholder="Type a command or search..."
            value={search}
            onValueChange={setSearch}
            className="flex-1 py-3 text-sm outline-none"
          />
          <kbd className="hidden h-5 select-none items-center gap-1 rounded border border-border bg-muted px-1.5 font-medium font-mono text-[10px] text-muted-foreground sm:inline-flex">
            ESC
          </kbd>
        </div>
        <Command.List className="max-h-[400px] overflow-y-auto p-2">
          <Command.Empty>No results found.</Command.Empty>

          <Command.Group heading="Navigation">
            <Command.Item onSelect={() => runCommand(() => nav("/"))}>
              <Home className="mr-2 h-4 w-4" />
              <span>Home</span>
            </Command.Item>
            <Command.Item onSelect={() => runCommand(() => nav("/app"))}>
              <BarChart3 className="mr-2 h-4 w-4" />
              <span>Dashboard</span>
            </Command.Item>
            <Command.Item
              onSelect={() => runCommand(() => nav("/app/contacts"))}
            >
              <Users className="mr-2 h-4 w-4" />
              <span>Contacts</span>
            </Command.Item>
            <Command.Item onSelect={() => runCommand(() => nav("/app/deals"))}>
              <BarChart3 className="mr-2 h-4 w-4" />
              <span>Deals</span>
            </Command.Item>
            <Command.Item
              onSelect={() => runCommand(() => nav("/app/settings"))}
            >
              <Settings className="mr-2 h-4 w-4" />
              <span>Settings</span>
            </Command.Item>
          </Command.Group>

          <Command.Group heading="Account">
            <Command.Item onSelect={() => runCommand(() => nav("/login"))}>
              <LogIn className="mr-2 h-4 w-4" />
              <span>Sign In</span>
            </Command.Item>
            <Command.Item onSelect={() => runCommand(() => nav("/register"))}>
              <UserPlus className="mr-2 h-4 w-4" />
              <span>Sign Up</span>
            </Command.Item>
          </Command.Group>
        </Command.List>
      </Command>
    </div>
  );
}
