import { createFileRoute, Link } from "@tanstack/react-router";
import { Bot, Zap, MessageSquare, Clock, ArrowUpRight, Plus } from "lucide-react";
import { Button } from "../components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "../components/ui/card";

export const Route = createFileRoute("/app")({
  component: Dashboard,
});

const stats = [
  { label: "Total Agents", value: "12", icon: Bot, change: "+2 this month" },
  { label: "API Calls", value: "45.2K", icon: Zap, change: "+18% vs last month" },
  { label: "Tokens Used", value: "2.1M", icon: MessageSquare, change: "+24% vs last month" },
  { label: "Avg Response", value: "1.2s", icon: Clock, change: "-0.3s vs last month" },
];

const recentActivity = [
  { agent: "Code Assistant", action: "Generated 50 lines of code", time: "2 min ago" },
  { agent: "Data Analyst", action: "Analyzed CSV file (1.2MB)", time: "15 min ago" },
  { agent: "Customer Support", action: "Handled 5 conversations", time: "1 hour ago" },
  { agent: "Research Agent", action: "Compiled research report", time: "2 hours ago" },
];

function Dashboard() {
  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-white">Dashboard</h1>
          <p className="text-zinc-400 mt-1">Welcome back! Here's an overview of your AI agents.</p>
        </div>
        <Link to="/agents/new">
          <Button>
            <Plus className="w-4 h-4 mr-2" />
            Create Agent
          </Button>
        </Link>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((stat) => {
          const Icon = stat.icon;
          return (
            <Card key={stat.label}>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div className="w-10 h-10 rounded-lg bg-violet-500/10 flex items-center justify-center">
                    <Icon className="w-5 h-5 text-violet-400" />
                  </div>
                  <span className="text-xs text-emerald-400 flex items-center gap-1">
                    <ArrowUpRight className="w-3 h-3" />
                    {stat.change.split(" ")[0]}
                  </span>
                </div>
                <div className="mt-4">
                  <p className="text-2xl font-bold text-white">{stat.value}</p>
                  <p className="text-sm text-zinc-400">{stat.label}</p>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="text-white">Recent Activity</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {recentActivity.map((item, i) => (
              <div key={i} className="flex items-start gap-3 pb-3 border-b border-zinc-800 last:border-0">
                <div className="w-8 h-8 rounded-lg bg-zinc-800 flex items-center justify-center">
                  <Bot className="w-4 h-4 text-violet-400" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-white">{item.agent}</p>
                  <p className="text-xs text-zinc-400">{item.action}</p>
                </div>
                <span className="text-xs text-zinc-500">{item.time}</span>
              </div>
            ))}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-white">Quick Actions</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <Link to="/agents/new">
              <Button variant="outline" className="w-full justify-start gap-3 h-auto py-4">
                <div className="w-8 h-8 rounded-lg bg-violet-600 flex items-center justify-center">
                  <Plus className="w-4 h-4 text-white" />
                </div>
                <div className="text-left">
                  <p className="font-medium">Create New Agent</p>
                  <p className="text-xs text-zinc-400">Build a custom AI agent</p>
                </div>
              </Button>
            </Link>
            <Link to="/agents">
              <Button variant="outline" className="w-full justify-start gap-3 h-auto py-4">
                <div className="w-8 h-8 rounded-lg bg-emerald-600 flex items-center justify-center">
                  <Bot className="w-4 h-4 text-white" />
                </div>
                <div className="text-left">
                  <p className="font-medium">Manage Agents</p>
                  <p className="text-xs text-zinc-400">View and edit your agents</p>
                </div>
              </Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
