import { Button, Card, CardContent, CardHeader, CardTitle, Textarea, Badge, Terminal } from "@crm/ui";
import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { ArrowLeft, Play, Loader2, CheckCircle, XCircle, Clock } from "lucide-react";
import { useState } from "react";

export const Route = createFileRoute("/app/agents/$agentId/execute")({
  component: AgentExecutePage,
});

function AgentExecutePage() {
  const { agentId } = Route.useParams();
  const navigate = useNavigate();
  const [task, setTask] = useState("");
  const [isExecuting, setIsExecuting] = useState(false);
  const [result, setResult] = useState<{ success: boolean; output: string; duration: number } | null>(null);

  const handleExecute = async () => {
    if (!task.trim()) return;
    setIsExecuting(true);
    setResult(null);

    // Simulate execution
    setTimeout(() => {
      setResult({
        success: true,
        output: `Task executed successfully.\n\nInput: ${task}\n\nOutput: This is a simulated execution result. In production, the agent would perform the requested task and return actual results.`,
        duration: Math.floor(Math.random() * 5000) + 1000,
      });
      setIsExecuting(false);
    }, 3000);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" onClick={() => navigate({ to: `/app/agents/${agentId}` })}>
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div>
          <h2 className="font-bold text-xl text-foreground">Execute Task</h2>
          <p className="text-muted-foreground text-sm">Run an autonomous task with this agent.</p>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card className="border-border/60">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Terminal className="h-5 w-5" /> Task Input
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Task Description</label>
              <Textarea
                placeholder="Describe the task you want the agent to perform..."
                value={task}
                onChange={(e) => setTask(e.target.value)}
                rows={8}
                className="font-mono text-sm"
              />
            </div>
            <div className="flex gap-2">
              <Button
                variant="outline"
                onClick={() => navigate({ to: `/app/agents/${agentId}` })}
              >
                Cancel
              </Button>
              <Button
                variant="primary"
                leftIcon={isExecuting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Play className="h-4 w-4" />}
                onClick={handleExecute}
                disabled={!task.trim() || isExecuting}
              >
                {isExecuting ? "Executing..." : "Execute"}
              </Button>
            </div>
          </CardContent>
        </Card>

        <Card className="border-border/60">
          <CardHeader>
            <CardTitle>Execution Result</CardTitle>
          </CardHeader>
          <CardContent>
            {result ? (
              <div className="space-y-4">
                <div className="flex items-center gap-2">
                  {result.success ? (
                    <Badge className="bg-green-100 text-green-800">
                      <CheckCircle className="h-3 w-3 mr-1" /> Success
                    </Badge>
                  ) : (
                    <Badge className="bg-red-100 text-red-800">
                      <XCircle className="h-3 w-3 mr-1" /> Failed
                    </Badge>
                  )}
                  <Badge variant="outline">
                    <Clock className="h-3 w-3 mr-1" /> {result.duration}ms
                  </Badge>
                </div>
                <pre className="bg-muted p-4 rounded-lg text-sm overflow-auto max-h-64 whitespace-pre-wrap">
                  {result.output}
                </pre>
              </div>
            ) : (
              <div className="text-center py-12 text-muted-foreground">
                <Terminal className="h-12 w-12 mx-auto mb-3 opacity-50" />
                <p>Execution results will appear here...</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
