import { createFileRoute, Link } from "@tanstack/react-router";
import {
  Card,
  CardContent,
} from "@crm/ui";
import {
  GitBranch,
  Plus,
  Trash2,
  Play,
  Save,
  FileCode,
  Box,
  Server,
  Database,
  Globe,
  Settings,
} from "lucide-react";

export const Route = createFileRoute("/app/devops/pipelines/new")({
  component: NewPipeline,
});

const stages = [
  { id: 1, name: "Build", icon: Box, jobs: ["Install dependencies", "Lint code", "Run tests"] },
  { id: 2, name: "Test", icon: Server, jobs: ["Unit tests", "Integration tests", "E2E tests"] },
  { id: 3, name: "Deploy Staging", icon: Globe, jobs: ["Build Docker image", "Push to registry", "Deploy to staging"] },
  { id: 4, name: "Deploy Production", icon: Globe, jobs: ["Deploy to production", "Run smoke tests"] },
];

function NewPipeline() {
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-foreground">Create New Pipeline</h2>
          <p className="text-sm text-muted-foreground">
            Build a new CI/CD pipeline using visual editor or YAML
          </p>
        </div>
        <div className="flex gap-2">
          <button className="flex items-center gap-2 px-4 py-2 rounded-lg border border-border text-sm font-medium hover:bg-muted/50 transition-colors">
            <FileCode className="h-4 w-4" />
            Edit YAML
          </button>
          <button className="flex items-center gap-2 px-4 py-2 rounded-lg bg-primary text-primary-foreground text-sm font-medium hover:bg-primary/90 transition-colors">
            <Save className="h-4 w-4" />
            Save Pipeline
          </button>
        </div>
      </div>

      {/* Pipeline Builder */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Visual Editor */}
        <div className="lg:col-span-2 space-y-6">
          <Card className="border-border/60">
            <CardContent className="p-6">
              <h3 className="font-bold text-foreground mb-4">Pipeline Configuration</h3>
              <div className="space-y-4">
                <div>
                  <label className="text-sm font-medium text-foreground mb-2 block">Pipeline Name</label>
                  <input
                    type="text"
                    placeholder="my-awesome-pipeline"
                    className="w-full rounded-lg border border-border bg-card px-4 py-2 text-sm"
                  />
                </div>
                <div>
                  <label className="text-sm font-medium text-foreground mb-2 block">Repository</label>
                  <select className="w-full rounded-lg border border-border bg-card px-4 py-2 text-sm">
                    <option value="">Select repository...</option>
                    <option value="frontend">github.com/nucleo/frontend</option>
                    <option value="backend">github.com/nucleo/backend</option>
                    <option value="data">github.com/nucleo/data</option>
                  </select>
                </div>
                <div>
                  <label className="text-sm font-medium text-foreground mb-2 block">Default Branch</label>
                  <select className="w-full rounded-lg border border-border bg-card px-4 py-2 text-sm">
                    <option value="main">main</option>
                    <option value="develop">develop</option>
                    <option value="staging">staging</option>
                  </select>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Visual Pipeline Builder */}
          <Card className="border-border/60">
            <CardContent className="p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-bold text-foreground">Visual Pipeline Editor</h3>
                <button className="flex items-center gap-2 text-xs text-primary hover:underline">
                  <Plus className="h-3 w-3" />
                  Add Stage
                </button>
              </div>
              <div className="space-y-4">
                {stages.map((stage, idx) => (
                  <div key={stage.id} className="relative">
                    {idx > 0 && (
                      <div className="absolute -top-4 left-1/2 transform -translate-x-1/2">
                        <div className="w-0.5 h-4 bg-border" />
                      </div>
                    )}
                    <div className={`p-4 rounded-lg border-2 ${
                      idx === stages.length - 1 ? "border-primary" : "border-border"
                    } bg-card`}>
                      <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center gap-2">
                          <div className="p-1.5 rounded bg-primary/10">
                            <stage.icon className="h-4 w-4 text-primary" />
                          </div>
                          <span className="font-medium">{stage.name}</span>
                        </div>
                        <div className="flex gap-1">
                          <button className="p-1 hover:bg-muted rounded">
                            <Plus className="h-4 w-4 text-muted-foreground" />
                          </button>
                          {stages.length > 1 && (
                            <button className="p-1 hover:bg-muted rounded">
                              <Trash2 className="h-4 w-4 text-muted-foreground" />
                            </button>
                          )}
                        </div>
                      </div>
                      <div className="space-y-2">
                        {stage.jobs.map((job, jobIdx) => (
                          <div key={jobIdx} className="flex items-center gap-2 p-2 rounded bg-muted/30 text-sm">
                            <GitBranch className="h-3 w-3 text-muted-foreground" />
                            <span>{job}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* YAML Preview */}
        <Card className="border-border/60">
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-bold text-foreground">YAML Configuration</h3>
              <button className="text-xs text-primary hover:underline">Copy</button>
            </div>
            <div className="bg-muted rounded-lg p-4 font-mono text-xs overflow-auto h-[500px]">
              <pre className="text-muted-foreground">{`name: my-pipeline
on:
  push:
    branches:
      - main
  pull_request:
    branches:
      - main

jobs:
  build:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - name: Install dependencies
        run: npm ci
      - name: Lint code
        run: npm run lint
      - name: Run tests
        run: npm test

  deploy-staging:
    needs: build
    runs-on: ubuntu-latest
    steps:
      - name: Build Docker image
        run: docker build -t app:\${{ github.sha }} .
      - name: Push to registry
        run: docker push registry.com/app
      - name: Deploy to staging
        run: kubectl apply -f staging/

  deploy-production:
    needs: deploy-staging
    runs-on: ubuntu-latest
    environment: production
    steps:
      - name: Deploy to production
        run: kubectl apply -f production/
      - name: Run smoke tests
        run: npm run smoke-test`}</pre>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
