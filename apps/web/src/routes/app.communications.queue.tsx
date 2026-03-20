import { Button, Card, CardContent, CardHeader, CardTitle, Badge, Input } from "@crm/ui";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import {
  ArrowLeft,
  Users,
  Plus,
  Phone,
  Clock,
  TrendingUp,
  Settings,
  Trash2,
  Play,
  Pause,
  User,
  Headphones,
} from "lucide-react";
import { useState } from "react";

export const Route = createFileRoute("/app/communications/queue")({
  component: CallQueuePage,
});

interface Queue {
  id: string;
  name: string;
  agents: number;
  waiting: number;
  avgWaitTime: string;
  callsToday: number;
  status: "open" | "closed" | "paused";
}

const MOCK_QUEUES: Queue[] = [
  { id: "q1", name: "Sales Queue", agents: 5, waiting: 3, avgWaitTime: "0:45", callsToday: 89, status: "open" },
  { id: "q2", name: "Support Queue", agents: 8, waiting: 7, avgWaitTime: "2:15", callsToday: 156, status: "open" },
  { id: "q3", name: "Billing Queue", agents: 3, waiting: 1, avgWaitTime: "0:30", callsToday: 45, status: "open" },
  { id: "q4", name: "After Hours", agents: 0, waiting: 0, avgWaitTime: "-", callsToday: 12, status: "closed" },
];

const AGENTS = [
  { id: "a1", name: "Sarah Johnson", status: "available", callsToday: 23 },
  { id: "a2", name: "Michael Chen", status: "busy", callsToday: 31 },
  { id: "a3", name: "Emily Davis", status: "available", callsToday: 18 },
  { id: "a4", name: "Robert Wilson", status: "away", callsToday: 12 },
];

function CallQueuePage() {
  const navigate = useNavigate();

  const getStatusColor = (status: string) => {
    switch (status) {
      case "available": return "bg-green-500";
      case "busy": return "bg-red-500";
      case "away": return "bg-amber-500";
      default: return "bg-gray-400";
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => navigate({ to: "/app/communications" })}>
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div>
            <h2 className="font-bold text-xl">Call Queue</h2>
            <p className="text-muted-foreground text-sm">Manage call queues and agents</p>
          </div>
        </div>
        <Button variant="primary" leftIcon={<Plus className="h-4 w-4" />}>
          Create Queue
        </Button>
      </div>

      {/* Stats */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card className="border-border/60">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-100">
                <Users className="h-5 w-5 text-blue-600" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Total Agents</p>
                <p className="text-xl font-bold">{AGENTS.length}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="border-border/60">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-amber-100">
                <Clock className="h-5 w-5 text-amber-600" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Waiting</p>
                <p className="text-xl font-bold">{MOCK_QUEUES.reduce((sum, q) => sum + q.waiting, 0)}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="border-border/60">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-green-100">
                <TrendingUp className="h-5 w-5 text-green-600" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Avg Wait Time</p>
                <p className="text-xl font-bold">1:10</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="border-border/60">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-purple-100">
                <Phone className="h-5 w-5 text-purple-600" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Calls Today</p>
                <p className="text-xl font-bold">{MOCK_QUEUES.reduce((sum, q) => sum + q.callsToday, 0)}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Queues */}
        <div className="lg:col-span-2">
          <Card className="border-border/60">
            <CardHeader>
              <CardTitle>Queues</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {MOCK_QUEUES.map((queue) => (
                <div key={queue.id} className="p-4 bg-muted/50 rounded-lg">
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-3">
                      <Headphones className="h-5 w-5 text-primary" />
                      <h3 className="font-semibold">{queue.name}</h3>
                      <Badge className={queue.status === "open" ? "bg-green-100 text-green-800" : queue.status === "paused" ? "bg-amber-100 text-amber-800" : "bg-gray-100 text-gray-800"}>
                        {queue.status}
                      </Badge>
                    </div>
                    <div className="flex gap-1">
                      <Button variant="ghost" size="icon" className="h-8 w-8">
                        {queue.status === "open" ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
                      </Button>
                      <Button variant="ghost" size="icon" className="h-8 w-8">
                        <Settings className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                  <div className="grid grid-cols-4 gap-4 text-sm">
                    <div>
                      <p className="text-muted-foreground">Agents</p>
                      <p className="font-semibold">{queue.agents}</p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">Waiting</p>
                      <p className="font-semibold text-amber-600">{queue.waiting}</p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">Avg Wait</p>
                      <p className="font-semibold">{queue.avgWaitTime}</p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">Today</p>
                      <p className="font-semibold">{queue.callsToday}</p>
                    </div>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
        </div>

        {/* Agents */}
        <div>
          <Card className="border-border/60">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users className="h-5 w-5" /> Agents
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {AGENTS.map((agent) => (
                <div key={agent.id} className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                  <div className="flex items-center gap-3">
                    <div className="relative">
                      <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/10">
                        <User className="h-4 w-4 text-primary" />
                      </div>
                      <div className={`absolute bottom-0 right-0 h-3 w-3 rounded-full border-2 border-background ${getStatusColor(agent.status)}`} />
                    </div>
                    <div>
                      <p className="font-medium text-sm">{agent.name}</p>
                      <p className="text-xs text-muted-foreground capitalize">{agent.status}</p>
                    </div>
                  </div>
                  <span className="text-xs text-muted-foreground">{agent.callsToday} calls</span>
                </div>
              ))}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
