import { Link, createFileRoute } from "@tanstack/react-router";
import { Bot, Edit, MoreVertical, Play, Plus, Search } from "lucide-react";
import { useEffect, useState } from "react";
import { Button } from "../components/ui/button";
import { Card, CardContent } from "../components/ui/card";
import { Input } from "../components/ui/input";

export const Route = createFileRoute("/agents")({
  component: AgentsPage,
});

interface Agent {
  id: string;
  name: string;
  description: string;
  type: string;
  isActive: boolean;
  avatarUrl: string;
  createdAt: string;
}

const agentTypes: Record<string, { bg: string; text: string; label: string }> =
  {
    chatbot: { bg: "bg-blue-500/10", text: "text-blue-400", label: "Chatbot" },
    autonomous: {
      bg: "bg-violet-500/10",
      text: "text-violet-400",
      label: "Autonomous",
    },
    code_execution: {
      bg: "bg-emerald-500/10",
      text: "text-emerald-400",
      label: "Code",
    },
    data_analysis: {
      bg: "bg-orange-500/10",
      text: "text-orange-400",
      label: "Analysis",
    },
  };

function AgentsPage() {
  const [agents, setAgents] = useState<Agent[]>([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/agents")
      .then((res) => res.json())
      .then((data) => {
        if (Array.isArray(data)) {
          setAgents(data);
        }
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  const filteredAgents = agents.filter(
    (agent) =>
      agent.name.toLowerCase().includes(search.toLowerCase()) ||
      agent.description?.toLowerCase().includes(search.toLowerCase()),
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-white">AI Agents</h1>
          <p className="text-zinc-400 mt-1">
            Manage and configure your AI agents
          </p>
        </div>
        <Link to="/agents/new">
          <Button className="gap-2">
            <Plus className="w-4 h-4" />
            Create Agent
          </Button>
        </Link>
      </div>

      <div className="relative max-w-md">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500" />
        <Input
          placeholder="Search agents..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="pl-10"
        />
      </div>

      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {[1, 2, 3].map((i) => (
            <Card key={i} className="animate-pulse">
              <CardContent className="p-6">
                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 rounded-lg bg-zinc-800" />
                  <div className="flex-1 space-y-2">
                    <div className="h-4 bg-zinc-800 rounded w-3/4" />
                    <div className="h-3 bg-zinc-800 rounded w-1/2" />
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : filteredAgents.length === 0 ? (
        <div className="text-center py-12">
          <Bot className="w-12 h-12 text-zinc-600 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-white mb-2">No agents yet</h3>
          <p className="text-zinc-400 mb-4">
            Create your first AI agent to get started
          </p>
          <Link to="/agents/new">
            <Button>
              <Plus className="w-4 h-4 mr-2" />
              Create Agent
            </Button>
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredAgents.map((agent) => {
            const typeStyle = agentTypes[agent.type] || agentTypes.chatbot;
            return (
              <Link
                key={agent.id}
                to={"/agents/$agentId" as const}
                params={{ agentId: agent.id }}
              >
                <Card className="hover:border-violet-500/50 transition-colors cursor-pointer group">
                  <CardContent className="p-6">
                    <div className="flex items-start justify-between">
                      <div className="flex items-start gap-4">
                        <div className="w-12 h-12 rounded-lg bg-zinc-800 flex items-center justify-center">
                          <Bot className="w-6 h-6 text-violet-400" />
                        </div>
                        <div>
                          <h3 className="font-semibold text-white group-hover:text-violet-400 transition-colors">
                            {agent.name}
                          </h3>
                          <p className="text-sm text-zinc-400 mt-1 line-clamp-2">
                            {agent.description || "No description"}
                          </p>
                        </div>
                      </div>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="opacity-0 group-hover:opacity-100 transition-opacity"
                      >
                        <MoreVertical className="w-4 h-4" />
                      </Button>
                    </div>
                    <div className="flex items-center justify-between mt-4 pt-4 border-t border-zinc-800">
                      <span
                        className={`text-xs px-2 py-1 rounded-full ${typeStyle.bg} ${typeStyle.text}`}
                      >
                        {typeStyle.label}
                      </span>
                      <div className="flex items-center gap-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          className="text-zinc-400 hover:text-white"
                        >
                          <Play className="w-3 h-3 mr-1" />
                          Run
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="text-zinc-400 hover:text-white"
                        >
                          <Edit className="w-3 h-3 mr-1" />
                          Edit
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}
