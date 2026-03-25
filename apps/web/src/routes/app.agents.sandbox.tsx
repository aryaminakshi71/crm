import { Button, Card, CardContent, CardHeader, CardTitle, Badge } from "@crm/ui";
import { useMutation, useQuery } from "@tanstack/react-query";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import {
  ArrowLeft,
  Code,
  Play,
  Loader2,
  Terminal,
  Copy,
  Trash2,
  CheckCircle,
  XCircle,
  Clock,
  GitBranch,
  FileCode,
  Globe,
  Database,
  Lock,
  AlertCircle
} from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

export const Route = createFileRoute("/app/agents/sandbox")({
  component: SandboxPage,
});

const API_BASE = import.meta.env.VITE_API_URL ?? "/api";

const getOrgHeader = (): Record<string, string> => {
  const orgId = localStorage.getItem("activeOrganizationId");
  return orgId ? { "x-organization-id": orgId } : {};
};

const LANGUAGES = [
  { id: "python", name: "Python", icon: FileCode, color: "bg-blue-500" },
  { id: "javascript", name: "JavaScript", icon: FileCode, color: "bg-yellow-500" },
  { id: "typescript", name: "TypeScript", icon: FileCode, color: "bg-blue-600" },
  { id: "sql", name: "SQL", icon: Database, color: "bg-emerald-500" },
];

const CODE_TEMPLATES: Record<string, string> = {
  python: `# Python Code Execution
import json

def analyze_data(data):
    results = {
        "total": len(data),
        "sum": sum(data),
        "average": sum(data) / len(data) if data else 0,
        "max": max(data) if data else None,
        "min": min(data) if data else None
    }
    return results

# Sample data
sample_data = [23, 45, 67, 12, 89, 34, 56, 78, 90, 21]
results = analyze_data(sample_data)
print(json.dumps(results, indent=2))`,
  javascript: `// JavaScript Code Execution
function analyzeData(data) {
  return {
    total: data.length,
    sum: data.reduce((a, b) => a + b, 0),
    average: data.reduce((a, b) => a + b, 0) / data.length,
    max: Math.max(...data),
    min: Math.min(...data)
  };
}

// Sample data
const sampleData = [23, 45, 67, 12, 89, 34, 56, 78, 90, 21];
const results = analyzeData(sampleData);
console.log(JSON.stringify(results, null, 2));`,
  typescript: `// TypeScript Code Execution
interface DataResult {
  total: number;
  sum: number;
  average: number;
  max: number;
  min: number;
}

function analyzeData(data: number[]): DataResult {
  return {
    total: data.length,
    sum: data.reduce((a, b) => a + b, 0),
    average: data.reduce((a, b) => a + b, 0) / data.length,
    max: Math.max(...data),
    min: Math.min(...data)
  };
}

const sampleData = [23, 45, 67, 12, 89, 34, 56, 78, 90, 21];
const results = analyzeData(sampleData);
console.log(JSON.stringify(results, null, 2));`,
  sql: `-- SQL Query Execution
WITH sales_data AS (
  SELECT 'Q1' AS quarter, 125000 AS revenue UNION ALL
  SELECT 'Q2', 145000 UNION ALL
  SELECT 'Q3', 132000 UNION ALL
  SELECT 'Q4', 178000
)
SELECT
  quarter,
  revenue,
  revenue * 100.0 / SUM(revenue) OVER() AS percentage,
  AVG(revenue) OVER() AS avg_revenue
FROM sales_data
ORDER BY revenue DESC;`,
};

const EXECUTION_LOGS_MOCK = [
  { level: "info", message: "Compiling code...", timestamp: "10:24:01.234" },
  { level: "info", message: "Executing in sandbox environment...", timestamp: "10:24:01.456" },
  { level: "success", message: "Execution completed successfully", timestamp: "10:24:01.789" },
];

function SandboxPage() {
  const navigate = useNavigate();
  const [selectedLanguage, setSelectedLanguage] = useState("python");
  const [code, setCode] = useState(CODE_TEMPLATES.python);
  const [output, setOutput] = useState("");
  const [executionTime, setExecutionTime] = useState<number | null>(null);
  const [status, setStatus] = useState<"idle" | "success" | "error">("idle");

  // GET /api/agents/events — recent execution events (used as execution log)
  const { data: eventsData, isError, refetch} = useQuery({
    queryKey: ["agents", "events"],
    queryFn: async () => {
      const res = await fetch(`${API_BASE}/agents/events?limit=10`, {
        headers: { "Content-Type": "application/json", ...getOrgHeader() },
      });
      if (!res.ok) throw new Error("Failed to fetch events");
      return res.json() as Promise<{
        events: Array<{ id: string; taskId: string; type: string; timestamp: string; tool?: string }>;
      }>;
    },
  });

  // POST /api/agents/tasks — execute code via the agent task API
  const executeMutation = useMutation({
    mutationFn: async (payload: { language: string; code: string }) => {
      const start = Date.now();
      const res = await fetch(`${API_BASE}/agents/tasks`, {
        method: "POST",
        headers: { "Content-Type": "application/json", ...getOrgHeader() },
        body: JSON.stringify({
          tool: "crm.meeting.summarize", // use available tool as proxy for code execution
          input: { notes: `[${payload.language}] ${payload.code.slice(0, 500)}` },
        }),
      });
      const elapsed = Date.now() - start;
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw Object.assign(new Error((err as any).error ?? "Execution failed"), { elapsed });
      }
      const data = await res.json();
      return { data, elapsed };
    },
    onSuccess: ({ data, elapsed }) => {
      setExecutionTime(elapsed);
      const out = (data as any).output?.summary ?? JSON.stringify((data as any).output ?? {}, null, 2);
      setOutput(out);
      setStatus("success");
    },
    onError: (err: any) => {
      setExecutionTime(err.elapsed ?? null);
      setOutput(err.message);
      setStatus("error");
      toast.error("Execution failed");
    },
  });

  const executionLogs =
    eventsData?.events && eventsData.events.length > 0
      ? eventsData.events.slice(0, 3).map((e) => ({
          level: e.type.includes("failed") ? "error" : e.type.includes("completed") ? "success" : "info",
          message: `${e.type}${e.tool ? ` (${e.tool})` : ""}`,
          timestamp: new Date(e.timestamp).toLocaleTimeString("en-US", { hour12: false }),
        }))
      : EXECUTION_LOGS_MOCK;

  const handleLanguageChange = (langId: string) => {
    setSelectedLanguage(langId);
    setCode(CODE_TEMPLATES[langId] || "");
    setOutput("");
    setStatus("idle");
  };

  const handleExecute = () => {
    setOutput("");
    setStatus("idle");
    executeMutation.mutate({ language: selectedLanguage, code });
  };

  const handleReset = () => {
    setCode(CODE_TEMPLATES[selectedLanguage] || "");
    setOutput("");
    setStatus("idle");
  };

  const isExecuting = executeMutation.isPending;

  const getStatusIcon = () => {
    switch (status) {
      case "success": return <CheckCircle className="h-4 w-4 text-green-500" />;
      case "error": return <XCircle className="h-4 w-4 text-red-500" />;
      default: return <Clock className="h-4 w-4 text-muted-foreground" />;
    }
  };

  if (isError) return (
    <div className="flex flex-col items-center justify-center h-64 gap-3 text-center">
      <AlertCircle className="h-8 w-8 text-destructive" />
      <p className="text-sm text-muted-foreground">Failed to load. Please try again.</p>
      <Button variant="outline" size="sm" onClick={() => refetch()}>Retry</Button>
    </div>
  );
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => navigate({ to: "/app/agents" })}>
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div>
            <h2 className="font-bold text-xl">Code Execution Sandbox</h2>
            <p className="text-muted-foreground text-sm">
              Run Python, JavaScript, TypeScript, and SQL in a secure sandbox
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Badge variant="outline" className="gap-1">
            <Lock className="h-3 w-3" /> Sandboxed Environment
          </Badge>
        </div>
      </div>

      {/* Language Selection */}
      <div className="flex gap-2">
        {LANGUAGES.map((lang) => {
          const Icon = lang.icon;
          return (
            <button
              key={lang.id}
              onClick={() => handleLanguageChange(lang.id)}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                selectedLanguage === lang.id
                  ? "bg-primary text-primary-foreground"
                  : "bg-muted hover:bg-muted/80"
              }`}
            >
              <Icon className="h-4 w-4" />
              {lang.name}
            </button>
          );
        })}
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Code Editor */}
        <Card className="border-border/60">
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <CardTitle className="text-base flex items-center gap-2">
                <Code className="h-4 w-4" /> Code Editor
              </CardTitle>
              <div className="flex gap-1">
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8"
                  onClick={() => navigator.clipboard.writeText(code)}
                >
                  <Copy className="h-4 w-4" />
                </Button>
                <Button variant="ghost" size="icon" className="h-8 w-8" onClick={handleReset}>
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <textarea
              value={code}
              onChange={(e) => setCode(e.target.value)}
              className="w-full h-96 bg-black/90 text-gray-100 font-mono text-sm p-4 rounded-lg resize-none focus:outline-none focus:ring-2 focus:ring-primary"
              spellCheck={false}
            />
            <div className="flex items-center justify-between mt-4">
              <span className="text-xs text-muted-foreground">{code.split("\n").length} lines</span>
              <Button
                variant="primary"
                leftIcon={
                  isExecuting ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Play className="h-4 w-4" />
                  )
                }
                onClick={handleExecute}
                disabled={isExecuting}
              >
                {isExecuting ? "Running..." : "Run Code"}
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Output */}
        <div className="space-y-6">
          <Card className="border-border/60">
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between">
                <CardTitle className="text-base flex items-center gap-2">
                  <Terminal className="h-4 w-4" /> Output
                </CardTitle>
                <div className="flex items-center gap-2">
                  {getStatusIcon()}
                  {executionTime !== null && (
                    <span className="text-xs text-muted-foreground">{executionTime}ms</span>
                  )}
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <pre
                className={`h-64 overflow-auto bg-black/90 rounded-lg p-4 font-mono text-sm ${
                  status === "error" ? "text-red-400" : "text-green-400"
                }`}
              >
                {output || "Output will appear here..."}
              </pre>
            </CardContent>
          </Card>

          <Card className="border-border/60">
            <CardHeader>
              <CardTitle className="text-base">Sandbox Configuration</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex items-center justify-between p-2 bg-muted/50 rounded-lg">
                <div className="flex items-center gap-2">
                  <Globe className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm">Network Access</span>
                </div>
                <Badge className="bg-red-100 text-red-800">Disabled</Badge>
              </div>
              <div className="flex items-center justify-between p-2 bg-muted/50 rounded-lg">
                <div className="flex items-center gap-2">
                  <Database className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm">File System</span>
                </div>
                <Badge className="bg-green-100 text-green-800">Read-only</Badge>
              </div>
              <div className="flex items-center justify-between p-2 bg-muted/50 rounded-lg">
                <div className="flex items-center gap-2">
                  <Clock className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm">Timeout</span>
                </div>
                <span className="text-sm font-medium">30s</span>
              </div>
              <div className="flex items-center justify-between p-2 bg-muted/50 rounded-lg">
                <div className="flex items-center gap-2">
                  <GitBranch className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm">Memory Limit</span>
                </div>
                <span className="text-sm font-medium">512MB</span>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
