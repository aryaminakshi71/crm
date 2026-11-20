import {
  Button,
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  Input,
} from "@crm/ui";
import { useMutation, useQuery } from "@tanstack/react-query";
import { createFileRoute, useNavigate, useSearch } from "@tanstack/react-router";
import {
  AlertCircle,
  Bot,
  ChevronDown,
  Play,
  RefreshCw,
  Search,
  Terminal,
  Trash2,
} from "lucide-react";
import { useState } from "react";
import { z } from "zod";

const searchSchema = z.object({
  q: z.string().optional(),
});

export const Route = createFileRoute("/app/agents/sandbox/_index")({
  validateSearch: searchSchema,
  component: AgentSandboxPage,
});

function AgentSandboxPage() {
  const { q = "" } = useSearch({ from: "/app/agents/sandbox/_index" });
  const navigate = useNavigate({ from: "/app/agents/sandbox" });
  const setQ = (v: string) => navigate({ search: (p) => ({ ...p, q: v || undefined }) });

  const [selectedAgentId, setSelectedAgentId] = useState<string>("");
  const [inputText, setInputText] = useState("");
  const [outputLog, setOutputLog] = useState<
    Array<{ type: "input" | "output" | "error" | "info"; content: string; ts: string }>
  >([]);

  const { data: agentsData, isLoading: agentsLoading } = useQuery({
    queryKey: ["agents", "list-sandbox"],
    queryFn: () =>
      fetch("/api/v1/agents?page=1&limit=50", {
        headers: {
          "Content-Type": "application/json",
          "x-organization-id":
            localStorage.getItem("activeOrganizationId") ?? "",
        },
      }).then((r) => r.json()),
  });

  const agents: any[] = (agentsData as any)?.data ?? (Array.isArray(agentsData) ? agentsData : []);

  const filteredAgents = agents.filter((a) =>
    !q || (a.name ?? a.id ?? "").toLowerCase().includes(q.toLowerCase()),
  );

  const runMutation = useMutation({
    mutationFn: async ({ agentId, input }: { agentId: string; input: string }) => {
      const res = await fetch(`/api/v1/agents/${agentId}/run`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-organization-id":
            localStorage.getItem("activeOrganizationId") ?? "",
        },
        body: JSON.stringify({ taskDescription: input }),
      });
      if (!res.ok) throw new Error(`Agent run failed: ${res.status}`);
      return res.json() as Promise<any>;
    },
    onMutate: ({ input }) => {
      setOutputLog((prev) => [
        ...prev,
        { type: "input", content: `> ${input}`, ts: new Date().toISOString() },
        { type: "info", content: "Running agent…", ts: new Date().toISOString() },
      ]);
    },
    onSuccess: (result) => {
      const output =
        typeof result === "string"
          ? result
          : (result as any)?.output ?? (result as any)?.result ?? (result as any)?.response ?? JSON.stringify(result, null, 2);
      setOutputLog((prev) => [
        ...prev.filter((l) => l.content !== "Running agent…"),
        { type: "output", content: output, ts: new Date().toISOString() },
      ]);
      setInputText("");
    },
    onError: (err: Error) => {
      setOutputLog((prev) => [
        ...prev.filter((l) => l.content !== "Running agent…"),
        {
          type: "error",
          content: `Error: ${err.message}`,
          ts: new Date().toISOString(),
        },
      ]);
    },
  });

  const selectedAgent = agents.find((a) => a.id === selectedAgentId);

  function handleRun() {
    if (!selectedAgentId || !inputText.trim()) return;
    runMutation.mutate({ agentId: selectedAgentId, input: inputText.trim() });
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === "Enter" && (e.ctrlKey || e.metaKey)) {
      e.preventDefault();
      handleRun();
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Agent Sandbox</h1>
        <p className="text-muted-foreground mt-1">
          Test and run agents manually in a playground environment
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Input Panel */}
        <div className="lg:col-span-1 space-y-4">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium flex items-center gap-2">
                <Bot className="h-4 w-4 text-primary" />
                Agent Selection
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {/* Agent search */}
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground pointer-events-none" />
                <Input
                  className="pl-9 h-8 text-sm"
                  placeholder="Filter agents…"
                  value={q}
                  onChange={(e) => setQ(e.target.value)}
                />
              </div>
              {agentsLoading ? (
                <div className="h-10 animate-pulse rounded bg-muted" />
              ) : filteredAgents.length === 0 ? (
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <AlertCircle className="h-4 w-4" />
                  {q ? "No agents match your search." : "No agents available."}
                </div>
              ) : (
                <div className="relative">
                  <select
                    value={selectedAgentId}
                    onChange={(e) => setSelectedAgentId(e.target.value)}
                    className="w-full appearance-none rounded-md border border-border bg-background px-3 py-2 pr-8 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                  >
                    <option value="">Select an agent…</option>
                    {filteredAgents.map((agent) => (
                      <option key={agent.id} value={agent.id}>
                        {agent.name ?? agent.id}
                      </option>
                    ))}
                  </select>
                  <ChevronDown className="absolute right-2.5 top-2.5 h-4 w-4 text-muted-foreground pointer-events-none" />
                </div>
              )}

              {selectedAgent && (
                <div className="rounded-md bg-muted/50 p-3 text-xs text-muted-foreground space-y-1">
                  {selectedAgent.description && (
                    <p>{selectedAgent.description}</p>
                  )}
                  {selectedAgent.type && (
                    <p>Type: {selectedAgent.type}</p>
                  )}
                  {selectedAgent.status && (
                    <p>
                      Status:{" "}
                      <span
                        className={
                          selectedAgent.status === "active"
                            ? "text-green-400"
                            : "text-muted-foreground"
                        }
                      >
                        {selectedAgent.status}
                      </span>
                    </p>
                  )}
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium flex items-center gap-2">
                <Terminal className="h-4 w-4 text-primary" />
                Input
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <textarea
                className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm font-mono resize-none focus:outline-none focus:ring-2 focus:ring-ring min-h-[120px]"
                placeholder="Describe the task for the agent…&#10;&#10;Press Ctrl+Enter to run"
                value={inputText}
                onChange={(e) => setInputText(e.target.value)}
                onKeyDown={handleKeyDown}
              />
              <div className="flex gap-2">
                <Button
                  className="flex-1"
                  onClick={handleRun}
                  disabled={
                    runMutation.isPending ||
                    !selectedAgentId ||
                    !inputText.trim()
                  }
                >
                  <Play className="h-4 w-4 mr-2" />
                  {runMutation.isPending ? "Running…" : "Run Agent"}
                </Button>
                <Button
                  variant="outline"
                  size="icon"
                  onClick={() => setOutputLog([])}
                  title="Clear output"
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
              <p className="text-xs text-muted-foreground">
                Tip: Press Ctrl+Enter to run
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Output Panel */}
        <div className="lg:col-span-2">
          <Card className="h-full">
            <CardHeader className="pb-3 flex flex-row items-center justify-between">
              <CardTitle className="text-sm font-medium flex items-center gap-2">
                <Terminal className="h-4 w-4 text-green-400" />
                Output
              </CardTitle>
              {outputLog.length > 0 && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setOutputLog([])}
                  className="h-7 text-xs text-muted-foreground"
                >
                  <RefreshCw className="h-3 w-3 mr-1" /> Clear
                </Button>
              )}
            </CardHeader>
            <CardContent>
              <div
                className="rounded-md bg-zinc-950 border border-zinc-800 p-4 min-h-[400px] max-h-[600px] overflow-y-auto font-mono text-sm space-y-2"
              >
                {outputLog.length === 0 ? (
                  <div className="flex flex-col items-center justify-center h-48 gap-3 text-zinc-500">
                    <Terminal className="h-8 w-8" />
                    <p className="text-xs">
                      Select an agent and enter a task to get started
                    </p>
                  </div>
                ) : (
                  outputLog.map((entry, i) => (
                    <div key={i} className="leading-relaxed">
                      <span className="text-zinc-600 text-xs mr-2">
                        {new Date(entry.ts).toLocaleTimeString()}
                      </span>
                      <span
                        className={
                          entry.type === "input"
                            ? "text-cyan-400"
                            : entry.type === "error"
                              ? "text-red-400"
                              : entry.type === "info"
                                ? "text-yellow-400/70 italic"
                                : "text-green-300"
                        }
                      >
                        {entry.content}
                      </span>
                    </div>
                  ))
                )}
                {runMutation.isPending && (
                  <div className="flex items-center gap-2 text-yellow-400/70 text-xs">
                    <span className="animate-pulse">▋</span>
                    Processing…
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
