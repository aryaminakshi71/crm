import { createFileRoute, Link } from "@tanstack/react-router";
import {
  Card,
  CardContent,
} from "@crm/ui";
import {
  ArrowLeft,
  Play,
  CheckCircle2,
  AlertCircle,
  Clock,
  Download,
  Copy,
  GitBranch,
  GitCommit,
  User,
  Terminal,
  Box,
} from "lucide-react";

export const Route = createFileRoute("/app/devops/runs/$id")({
  component: RunDetail,
});

const runDetail = {
  id: 1,
  pipeline: "frontend-app",
  status: "success",
  duration: "4m 23s",
  branch: "main",
  commit: "abc1234",
  message: "Update homepage styles",
  author: "John Smith",
  startedAt: "Mar 20, 2026 10:45:23 AM",
  finishedAt: "Mar 20, 2026 10:49:46 AM",
  stages: [
    { name: "Build", status: "success", duration: "1m 12s" },
    { name: "Test", status: "success", duration: "2m 05s" },
    { name: "Deploy Staging", status: "success", duration: "1m 06s" },
  ],
  logs: `2026-03-20T10:45:23.123Z [INFO] Starting pipeline run
2026-03-20T10:45:23.456Z [INFO] Checking out code from main branch
2026-03-20T10:45:25.789Z [INFO] Installing dependencies...
2026-03-20T10:46:12.345Z [INFO] Dependencies installed successfully
2026-03-20T10:46:13.567Z [INFO] Running linter...
2026-03-20T10:46:20.123Z [INFO] Linting passed
2026-03-20T10:46:21.456Z [INFO] Running unit tests...
2026-03-20T10:47:30.789Z [INFO] All 42 tests passed
2026-03-20T10:47:31.012Z [INFO] Building Docker image...
2026-03-20T10:48:15.345Z [INFO] Docker image built successfully
2026-03-20T10:48:16.567Z [INFO] Pushing to container registry...
2026-03-20T10:48:45.678Z [INFO] Image pushed to registry
2026-03-20T10:48:46.890Z [INFO] Deploying to staging environment...
2026-03-20T10:49:46.123Z [INFO] Deployment successful
2026-03-20T10:49:46.456Z [SUCCESS] Pipeline completed successfully`,
  artifacts: [
    { name: "test-results", size: "1.2 MB", type: "JUnit XML" },
    { name: "coverage-report", size: "4.5 MB", type: "HTML" },
    { name: "docker-image", size: "145 MB", type: "Container Image" },
  ],
};

function RunDetail() {
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Link to="/app/devops/runs" className="p-2 rounded-lg hover:bg-muted transition-colors">
          <ArrowLeft className="h-5 w-5 text-muted-foreground" />
        </Link>
        <div className="flex-1">
          <div className="flex items-center gap-3">
            <h2 className="text-xl font-bold text-foreground">{runDetail.pipeline} - Run #{runDetail.id}</h2>
            <span className={`rounded-full px-3 py-1 text-sm font-medium ${
              runDetail.status === "success" ? "bg-green-500/10 text-green-500" :
              runDetail.status === "failed" ? "bg-red-500/10 text-red-500" :
              "bg-blue-500/10 text-blue-500"
            }`}>
              {runDetail.status}
            </span>
          </div>
          <p className="text-sm text-muted-foreground">{runDetail.message}</p>
        </div>
        <div className="flex gap-2">
          <button className="flex items-center gap-2 px-4 py-2 rounded-lg border border-border text-sm font-medium hover:bg-muted/50 transition-colors">
            <Download className="h-4 w-4" />
            Logs
          </button>
          <button className="flex items-center gap-2 px-4 py-2 rounded-lg bg-primary text-primary-foreground text-sm font-medium hover:bg-primary/90 transition-colors">
            <Play className="h-4 w-4" />
            Re-run
          </button>
        </div>
      </div>

      {/* Run Info */}
      <Card className="border-border/60">
        <CardContent className="p-6">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            <div>
              <p className="text-xs text-muted-foreground mb-1">Duration</p>
              <p className="text-lg font-bold">{runDetail.duration}</p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground mb-1">Branch</p>
              <p className="text-lg font-bold flex items-center gap-1">
                <GitBranch className="h-4 w-4" />
                {runDetail.branch}
              </p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground mb-1">Commit</p>
              <p className="text-lg font-bold font-mono">{runDetail.commit}</p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground mb-1">Author</p>
              <p className="text-lg font-bold flex items-center gap-1">
                <User className="h-4 w-4" />
                {runDetail.author}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Stages */}
      <Card className="border-border/60">
        <CardContent className="p-6">
          <h3 className="font-bold text-foreground mb-4">Pipeline Stages</h3>
          <div className="flex items-center gap-4">
            {runDetail.stages.map((stage, idx) => (
              <div key={stage.name} className="flex items-center">
                <div className="text-center">
                  <div className={`p-3 rounded-lg ${
                    stage.status === "success" ? "bg-green-500/10" :
                    stage.status === "failed" ? "bg-red-500/10" :
                    "bg-blue-500/10"
                  }`}>
                    {stage.status === "success" ? (
                      <CheckCircle2 className="h-6 w-6 text-green-500" />
                    ) : stage.status === "failed" ? (
                      <AlertCircle className="h-6 w-6 text-red-500" />
                    ) : (
                      <Clock className="h-6 w-6 text-blue-500" />
                    )}
                  </div>
                  <p className="font-medium mt-2">{stage.name}</p>
                  <p className="text-xs text-muted-foreground">{stage.duration}</p>
                </div>
                {idx < runDetail.stages.length - 1 && (
                  <div className="w-12 h-0.5 bg-border mx-2" />
                )}
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Logs */}
        <div className="lg:col-span-2">
          <Card className="border-border/60">
            <CardContent className="p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-bold text-foreground">Build Logs</h3>
                <div className="flex gap-1">
                  <button className="p-1.5 rounded hover:bg-muted transition-colors" title="Copy">
                    <Copy className="h-4 w-4 text-muted-foreground" />
                  </button>
                  <button className="p-1.5 rounded hover:bg-muted transition-colors" title="Download">
                    <Download className="h-4 w-4 text-muted-foreground" />
                  </button>
                </div>
              </div>
              <div className="bg-muted rounded-lg p-4 font-mono text-xs overflow-auto h-[400px]">
                <pre className="text-muted-foreground whitespace-pre-wrap">{runDetail.logs}</pre>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Artifacts */}
        <Card className="border-border/60">
          <CardContent className="p-6">
            <h3 className="font-bold text-foreground mb-4">Artifacts</h3>
            <div className="space-y-3">
              {runDetail.artifacts.map((artifact, idx) => (
                <div key={idx} className="flex items-center gap-3 p-3 rounded-lg border border-border/40 hover:bg-muted/30 transition-colors">
                  <div className="p-2 rounded-lg bg-primary/10">
                    <Box className="h-4 w-4 text-primary" />
                  </div>
                  <div className="flex-1">
                    <p className="font-medium text-sm">{artifact.name}</p>
                    <p className="text-xs text-muted-foreground">{artifact.type} - {artifact.size}</p>
                  </div>
                  <button className="p-1 hover:bg-muted rounded">
                    <Download className="h-4 w-4 text-muted-foreground" />
                  </button>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
