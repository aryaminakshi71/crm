import { Button, Card, CardContent, Input } from "@crm/ui";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import {
  ArrowLeft,
  Plus,
  Search,
  Edit,
  Trash2,
  Mic,
  Power,
  AlertCircle
} from "lucide-react";
import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { speechApi } from "@/lib/api";

export const Route = createFileRoute("/app/speech/commands")({
  component: CommandsPage,
});

interface Command {
  id: string;
  phrase: string;
  action: string;
  enabled: boolean;
  usageCount: number;
}

function CommandsPage() {
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState("");

  const { data, isLoading, refetch, isError} = useQuery({
    queryKey: ["speech", "commands"],
    queryFn: () => speechApi.commands.list(),
    placeholderData: (prev) => prev,
  });

  const commands: Command[] = (data as any)?.data ?? [];

  const filteredCommands = commands.filter((cmd) =>
    (cmd.phrase ?? "").toLowerCase().includes(searchQuery.toLowerCase()) ||
    (cmd.action ?? "").toLowerCase().includes(searchQuery.toLowerCase())
  );

  if (isError) return (
    <div className="flex flex-col items-center justify-center h-64 gap-3 text-center">
      <AlertCircle className="h-8 w-8 text-destructive" />
      <p className="text-sm text-muted-foreground">Failed to load. Please try again.</p>
      <Button variant="outline" size="sm" onClick={() => refetch()}>Retry</Button>
    </div>
  );
  if (isLoading) return (
    <div className="flex items-center justify-center h-64">
      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
    </div>
  );

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => navigate({ to: "/app/speech" })}>
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div>
            <h2 className="font-bold text-xl">Voice Commands</h2>
            <p className="text-muted-foreground text-sm">Configure voice commands for hands-free control</p>
          </div>
        </div>
        <Button variant="primary" leftIcon={<Plus className="h-4 w-4" />}>
          Add Command
        </Button>
      </div>

      <div className="relative max-w-md">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <input
          type="text"
          placeholder="Search commands..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full pl-10 pr-4 py-2 border rounded-lg bg-background text-sm"
        />
      </div>

      <Card className="border-border/60">
        <CardContent className="p-0">
          <div className="divide-y divide-border">
            {filteredCommands.map((cmd) => (
              <div key={cmd.id} className="flex items-center gap-4 p-4 hover:bg-muted/50 transition-colors">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
                  <Mic className="h-5 w-5 text-primary" />
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="font-medium">"{cmd.phrase}"</h3>
                  <p className="text-sm text-muted-foreground">{cmd.action}</p>
                </div>
                <div className="text-right text-sm text-muted-foreground mr-4">
                  {cmd.usageCount.toLocaleString()} uses
                </div>
                <button
                  onClick={() => {}}
                  className={`w-12 h-6 rounded-full transition-colors ${cmd.enabled ? "bg-primary" : "bg-muted"}`}
                >
                  <div className={`w-5 h-5 rounded-full bg-white shadow transition-transform ${
                    cmd.enabled ? "translate-x-6" : "translate-x-0.5"
                  }`} />
                </button>
                <Button variant="ghost" size="icon" className="h-8 w-8">
                  <Edit className="h-4 w-4" />
                </Button>
                <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive">
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
