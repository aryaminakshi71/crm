/**
 * Speech Commands Index
 *
 * Configure voice commands for hands-free control of the platform.
 */

import { Badge, Button, Card, CardContent, Input, Loading } from "@crm/ui";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { createFileRoute, useSearch, useNavigate } from "@tanstack/react-router";
import { z } from "zod";
import {
  AlertCircle,
  Edit,
  Mic,
  Plus,
  Search,
  Trash2,
} from "lucide-react";
import { useState } from "react";
import { speechApi } from "@/lib/api";

const searchSchema = z.object({
  q: z.string().optional(),
  category: z.string().optional(),
});

export const Route = createFileRoute("/app/speech/commands/_index")({
  validateSearch: searchSchema,
  component: CommandsIndexPage,
});

interface Command {
  id: string;
  phrase?: string;
  command?: string;
  action?: string;
  actionTriggered?: string;
  category?: string;
  usageCount?: number;
  uses?: number;
  enabled?: boolean;
  isEnabled?: boolean;
  isActive?: boolean;
}

const _MOCK_COMMANDS: Command[] = [
  { id: "c1", phrase: "Hey Nucleo", action: "Wake word activation", category: "System", usageCount: 1247, enabled: true },
  { id: "c2", phrase: "Start transcription", action: "Begin audio transcription", category: "Recording", usageCount: 456, enabled: true },
  { id: "c3", phrase: "Stop transcription", action: "End current transcription", category: "Recording", usageCount: 389, enabled: true },
  { id: "c4", phrase: "Create summary", action: "Generate meeting notes", category: "AI", usageCount: 234, enabled: true },
  { id: "c5", phrase: "Open contacts", action: "Navigate to contacts page", category: "Navigation", usageCount: 88, enabled: true },
  { id: "c6", phrase: "Export to PDF", action: "Export current document", category: "Export", usageCount: 0, enabled: false },
];

function getPhrase(c: Command) { return c.phrase ?? c.command ?? "Unknown Command"; }
function getAction(c: Command) { return c.action ?? c.actionTriggered ?? "—"; }
function getUsage(c: Command) { return c.usageCount ?? c.uses ?? 0; }
function isEnabled(c: Command) { return c.enabled ?? c.isEnabled ?? c.isActive ?? true; }

function CommandsIndexPage() {
  const queryClient = useQueryClient();
  const { q: searchQuery = "", category: filterCategory = "all" } = useSearch({ from: "/app/speech/commands/_index" });
  const navigate = useNavigate({ from: "/app/speech/commands" });
  const setSearchQuery = (v: string) => navigate({ search: (p) => ({ ...p, q: v }) });
  const setFilterCategory = (v: string) => navigate({ search: (p) => ({ ...p, category: v }) });
  const [showCreate, setShowCreate] = useState(false);
  const [newPhrase, setNewPhrase] = useState("");
  const [newAction, setNewAction] = useState("");
  const [newCategory, setNewCategory] = useState("");

  const { data, isLoading, isError, refetch } = useQuery({
    queryKey: ["speech-commands-index"],
    queryFn: () => speechApi.commands.list(),
    placeholderData: (prev) => prev,
  });

  const createMutation = useMutation({
    mutationFn: (payload: { phrase: string; action: string; category: string }) =>
      speechApi.commands.create(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["speech-commands-index"] });
      setShowCreate(false);
      setNewPhrase("");
      setNewAction("");
      setNewCategory("");
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => speechApi.commands.delete(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["speech-commands-index"] }),
  });

  const commands: Command[] = (data as any)?.data ?? [];

  const categories = ["all", ...new Set(commands.map((c) => c.category).filter(Boolean) as string[])];

  const filtered = commands.filter((c) => {
    const q = searchQuery.toLowerCase();
    const matchSearch =
      !q ||
      getPhrase(c).toLowerCase().includes(q) ||
      getAction(c).toLowerCase().includes(q) ||
      (c.category ?? "").toLowerCase().includes(q);
    const matchCat = filterCategory === "all" || c.category === filterCategory;
    return matchSearch && matchCat;
  });

  const totalCommands = commands.length;
  const mostUsed = commands.reduce(
    (best, c) => (getUsage(c) > getUsage(best) ? c : best),
    commands[0] ?? ({ id: "", usageCount: 0 } as Command)
  );
  const enabledCount = commands.filter(isEnabled).length;

  if (isLoading) return <Loading />;
  if (isError) return (
    <div className="flex flex-col items-center justify-center h-64 gap-4">
      <AlertCircle className="h-8 w-8 text-destructive" />
      <p className="text-muted-foreground">Failed to load commands. Please try again.</p>
      <Button variant="outline" size="sm" onClick={() => refetch()}>Retry</Button>
    </div>
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-lg font-semibold text-foreground">Voice Commands</h2>
          <p className="text-sm text-muted-foreground">Configure hands-free voice control</p>
        </div>
        <Button
          variant="primary"
          size="sm"
          leftIcon={<Plus className="h-4 w-4" />}
          onClick={() => setShowCreate(true)}
        >
          Add Command
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <Card className="border-border/60">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Total Commands</p>
                <p className="text-2xl font-black text-foreground mt-0.5">{totalCommands}</p>
                <p className="text-xs text-muted-foreground mt-1">{enabledCount} enabled</p>
              </div>
              <div className="rounded-xl bg-blue-100 p-2.5 text-blue-600">
                <Mic className="h-5 w-5" />
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="border-border/60">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Most Used</p>
                <p className="text-sm font-bold text-foreground mt-1 truncate max-w-[160px]">
                  "{getPhrase(mostUsed)}"
                </p>
                <p className="text-xs text-muted-foreground">{getUsage(mostUsed).toLocaleString()} uses</p>
              </div>
              <div className="rounded-xl bg-purple-100 p-2.5 text-purple-600">
                <Mic className="h-5 w-5" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Create Form */}
      {showCreate && (
        <Card className="border-primary/40">
          <CardContent className="p-4 space-y-3">
            <p className="text-sm font-semibold">New Voice Command</p>
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
              <Input
                placeholder='Phrase (e.g. "Open tasks")'
                value={newPhrase}
                onChange={(e) => setNewPhrase(e.target.value)}
              />
              <Input
                placeholder="Action triggered"
                value={newAction}
                onChange={(e) => setNewAction(e.target.value)}
              />
              <Input
                placeholder="Category (e.g. Navigation)"
                value={newCategory}
                onChange={(e) => setNewCategory(e.target.value)}
              />
            </div>
            <div className="flex gap-2 justify-end">
              <Button variant="outline" size="sm" onClick={() => setShowCreate(false)}>Cancel</Button>
              <Button
                variant="primary"
                size="sm"
                disabled={!newPhrase || !newAction || createMutation.isPending}
                onClick={() =>
                  createMutation.mutate({ phrase: newPhrase, action: newAction, category: newCategory || "Custom" })
                }
              >
                {createMutation.isPending ? "Adding..." : "Add Command"}
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Filters */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search commands..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>
        <select
          className="h-10 rounded-lg border border-input bg-background px-3 text-sm"
          value={filterCategory}
          onChange={(e) => setFilterCategory(e.target.value)}
        >
          {categories.map((cat) => (
            <option key={cat} value={cat}>
              {cat === "all" ? "All Categories" : cat}
            </option>
          ))}
        </select>
      </div>

      {/* Commands List */}
      <Card className="border-border/60">
        <CardContent className="p-0">
          {filtered.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 gap-3">
              <Mic className="h-10 w-10 text-muted-foreground/40" />
              <p className="text-muted-foreground text-sm">No commands found</p>
            </div>
          ) : (
            <div className="divide-y divide-border">
              {filtered.map((cmd) => (
                <div
                  key={cmd.id}
                  className="flex items-center gap-4 p-4 hover:bg-muted/30 transition-colors"
                >
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
                    <Mic className="h-5 w-5 text-primary" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-foreground">"{getPhrase(cmd)}"</p>
                    <p className="text-sm text-muted-foreground">{getAction(cmd)}</p>
                  </div>
                  {cmd.category && (
                    <Badge variant="default" size="sm">{cmd.category}</Badge>
                  )}
                  <div className="text-right text-sm text-muted-foreground mr-2">
                    {getUsage(cmd).toLocaleString()} uses
                  </div>
                  <button
                    type="button"
                    className={`relative w-11 h-6 rounded-full transition-colors ${
                      isEnabled(cmd) ? "bg-primary" : "bg-muted-foreground/30"
                    }`}
                  >
                    <span
                      className={`absolute top-0.5 left-0.5 w-5 h-5 rounded-full bg-white shadow transition-transform ${
                        isEnabled(cmd) ? "translate-x-5" : "translate-x-0"
                      }`}
                    />
                  </button>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 text-destructive"
                    disabled={deleteMutation.isPending}
                    onClick={() => deleteMutation.mutate(cmd.id)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
