import { Button, Card, CardContent, CardHeader, CardTitle, Badge, Select, Input, Terminal } from "@crm/ui";
import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import {
  ArrowLeft,
  Bot,
  Play,
  Square,
  Pause,
  Loader2,
  Clock,
  CheckCircle,
  XCircle,
  AlertCircle,
  Copy,
  Download,
  Trash2,
  Code,
  Database,
  BarChart3,
  FileText,
  Image,
} from "lucide-react";
import { useState } from "react";

export const Route = createFileRoute("/app/agents/$agentId/execute")({
  component: AgentExecutePage,
});

interface Task {
  id: string;
  name: string;
  status: "pending" | "running" | "completed" | "failed";
  progress: number;
  result?: string;
  duration?: string;
  timestamp: Date;
}

const TASK_TYPES = [
  { value: "code_generation", label: "Code Generation", icon: Code },
  { value: "data_analysis", label: "Data Analysis", icon: BarChart3 },
  { value: "document_generation", label: "Document Generation", icon: FileText },
  { value: "image_generation", label: "Image Generation", icon: Image },
  { value: "db_query", label: "Database Query", icon: Database },
];

const EXECUTION_LOGS = [
  { level: "info", message: "Initializing agent execution environment...", timestamp: "10:23:01" },
  { level: "info", message: "Loading agent configuration...", timestamp: "10:23:02" },
  { level: "info", message: "Validating input parameters...", timestamp: "10:23:03" },
  { level: "info", message: "Starting task execution...", timestamp: "10:23:04" },
  { level: "info", message: "Fetching data from source...", timestamp: "10:23:05" },
  { level: "info", message: "Processing 1,247 records...", timestamp: "10:23:08" },
  { level: "info", message: "Generating analysis report...", timestamp: "10:23:12" },
  { level: "info", message: "Task completed successfully", timestamp: "10:23:15" },
];

function AgentExecutePage() {
  const { agentId } = Route.useParams();
  const navigate = useNavigate();
  const [selectedTask, setSelectedTask] = useState("code_generation");
  const [taskInput, setTaskInput] = useState("");
  const [isExecuting, setIsExecuting] = useState(false);
  const [executionLogs, setExecutionLogs] = useState<typeof EXECUTION_LOGS>([]);
  const [taskHistory] = useState<Task[]>([
    { id: "1", name: "Generate API Documentation", status: "completed", progress: 100, duration: "4.2s", timestamp: new Date(Date.now() - 300000) },
    { id: "2", name: "Analyze Sales Data Q4", status: "completed", progress: 100, duration: "8.5s", timestamp: new Date(Date.now() - 600000) },
    { id: "3", name: "Create User Dashboard", status: "failed", progress: 45, result: "Timeout after 30s", timestamp: new Date(Date.now() - 900000) },
    { id: "4", name: "Export Database Schema", status: "completed", progress: 100, duration: "2.1s", timestamp: new Date(Date.now() - 1200000) },
  ]);

  const selectedTaskType = TASK_TYPES.find((t) => t.value === selectedTask);
  const TaskIcon = selectedTaskType?.icon || Code;

  const handleExecute = async () => {
    if (!taskInput.trim()) return;
    setIsExecuting(true);
    setExecutionLogs([]);

    for (const log of EXECUTION_LOGS) {
      await new Promise((resolve) => setTimeout(resolve, 500));
      setExecutionLogs((prev) => [...prev, log]);
    }

    setIsExecuting(false);
  };

  const getStatusIcon = (status: Task["status"]) => {
    switch (status) {
      case "completed": return <CheckCircle className="h-4 w-4 text-green-500" />;
      case "failed": return <XCircle className="h-4 w-4 text-red-500" />;
      case "running": return <Loader2 className="h-4 w-4 text-blue-500 animate-spin" />;
      default: return <Clock className="h-4 w-4 text-muted-foreground" />;
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => navigate({ to: "/app/agents" })}>
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div>
            <h2 className="font-bold text-xl">Task Execution</h2>
            <p className="text-muted-foreground text-sm">Run autonomous tasks with your AI agent</p>
          </div>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2 space-y-6">
          <Card className="border-border/60">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Play className="h-5 w-5" /> Configure Task
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">Task Type</label>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                  {TASK_TYPES.map((type) => {
                    const Icon = type.icon;
                    return (
                      <button
                        key={type.value}
                        type="button"
                        onClick={() => setSelectedTask(type.value)}
                        className={`p-3 border rounded-lg text-left transition-colors flex items-center gap-2 ${
                          selectedTask === type.value
                            ? "border-primary bg-primary/5"
                            : "border-border hover:border-primary/50"
                        }`}
                      >
                        <Icon className="h-4 w-4" />
                        <span className="text-sm font-medium">{type.label}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">Task Description</label>
                <textarea
                  className="w-full px-3 py-2 border rounded-lg bg-background h-32 font-mono text-sm resize-none"
                  placeholder="Describe the task you want the agent to perform..."
                  value={taskInput}
                  onChange={(e) => setTaskInput(e.target.value)}
                />
              </div>

              <div className="flex gap-3">
                <Button
                  variant="primary"
                  leftIcon={isExecuting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Play className="h-4 w-4" />}
                  onClick={handleExecute}
                  disabled={!taskInput.trim() || isExecuting}
                >
                  {isExecuting ? "Executing..." : "Execute Task"}
                </Button>
                {isExecuting && (
                  <Button variant="outline" leftIcon={<Square className="h-4 w-4" />}>
                    Stop
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>

          <Card className="border-border/60">
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center gap-2">
                  <Terminal className="h-5 w-5" /> Execution Logs
                </CardTitle>
                <Button variant="ghost" size="sm">
                  <Copy className="h-4 w-4" />
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <div className="bg-black/90 rounded-lg p-4 font-mono text-sm h-64 overflow-y-auto">
                {executionLogs.length === 0 ? (
                  <p className="text-muted-foreground">No logs yet. Execute a task to see logs here.</p>
                ) : (
                  executionLogs.map((log, idx) => (
                    <div key={idx} className="flex gap-3 text-xs mb-1">
                      <span className="text-muted-foreground">[{log.timestamp}]</span>
                      <span className={
                        log.level === "error" ? "text-red-400" :
                        log.level === "warning" ? "text-amber-400" :
                        "text-green-400"
                      }>
                        {log.level.toUpperCase()}
                      </span>
                      <span className="text-gray-300">{log.message}</span>
                    </div>
                  )
                ))}
                {isExecuting && (
                  <div className="flex items-center gap-2 text-blue-400 mt-2">
                    <Loader2 className="h-3 w-3 animate-spin" />
                    <span>Processing...</span>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="space-y-6">
          <Card className="border-border/60">
            <CardHeader>
              <CardTitle className="text-base">Recent Tasks</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {taskHistory.map((task) => (
                <div key={task.id} className="p-3 bg-muted/50 rounded-lg">
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex items-center gap-2">
                      {getStatusIcon(task.status)}
                      <span className="text-sm font-medium">{task.name}</span>
                    </div>
                  </div>
                  <div className="flex items-center justify-between text-xs text-muted-foreground">
                    <span>{task.timestamp.toLocaleTimeString()}</span>
                    {task.duration && <span>{task.duration}</span>}
                  </div>
                  {task.status === "running" && (
                    <div className="mt-2 h-1 bg-muted rounded-full overflow-hidden">
                      <div
                        className="h-full bg-primary transition-all"
                        style={{ width: `${task.progress}%` }}
                      />
                    </div>
                  )}
                </div>
              ))}
            </CardContent>
          </Card>

          <Card className="border-border/60 bg-muted/30">
            <CardContent className="p-4">
              <div className="flex items-center gap-2 text-sm">
                <AlertCircle className="h-4 w-4 text-blue-500" />
                <span className="text-muted-foreground">Tasks run with the agent's configured permissions.</span>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
