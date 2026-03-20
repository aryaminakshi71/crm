import { Button, Card, CardContent, CardHeader, CardTitle, Badge, Input, Select } from "@crm/ui";
import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import {
  ArrowLeft,
  Bot,
  Plus,
  Play,
  Pause,
  Settings,
  Trash2,
  MessageSquare,
  GitBranch,
  Database,
  Mail,
  ArrowRight,
  Copy,
  Download,
} from "lucide-react";
import { useState } from "react";

export const Route = createFileRoute("/app/communications/chatbot")({
  component: ChatbotBuilderPage,
});

interface FlowNode {
  id: string;
  type: "trigger" | "message" | "condition" | "action" | "end";
  label: string;
  position: { x: number; y: number };
}

const MOCK_BOTS = [
  { id: "b1", name: "Customer Support Bot", status: "active", conversations: 1247, satisfaction: 94.2 },
  { id: "b2", name: "Sales Bot", status: "active", conversations: 892, satisfaction: 91.5 },
  { id: "b3", name: "FAQ Bot", status: "draft", conversations: 0, satisfaction: 0 },
];

function ChatbotBuilderPage() {
  const navigate = useNavigate();
  const [selectedBot, setSelectedBot] = useState<string | null>("b1");

  const selectedBotData = MOCK_BOTS.find((b) => b.id === selectedBot);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => navigate({ to: "/app/communications" })}>
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div>
            <h2 className="font-bold text-xl">Chatbot Builder</h2>
            <p className="text-muted-foreground text-sm">Create AI-powered chatbots for your website</p>
          </div>
        </div>
        <Button variant="primary" leftIcon={<Plus className="h-4 w-4" />}>
          Create Bot
        </Button>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Bot List */}
        <div>
          <Card className="border-border/60">
            <CardHeader>
              <CardTitle className="text-base">Your Chatbots</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              {MOCK_BOTS.map((bot) => (
                <div
                  key={bot.id}
                  className={`p-3 rounded-lg cursor-pointer transition-colors ${
                    selectedBot === bot.id ? "bg-primary/10 border border-primary" : "hover:bg-muted/50"
                  }`}
                  onClick={() => setSelectedBot(bot.id)}
                >
                  <div className="flex items-center justify-between mb-1">
                    <span className="font-medium text-sm">{bot.name}</span>
                    <Badge className={bot.status === "active" ? "bg-green-100 text-green-800" : "bg-gray-100 text-gray-800"}>
                      {bot.status}
                    </Badge>
                  </div>
                  {bot.status === "active" && (
                    <div className="flex items-center gap-3 text-xs text-muted-foreground">
                      <span>{bot.conversations.toLocaleString()} conv.</span>
                      <span>{bot.satisfaction}% satisfaction</span>
                    </div>
                  )}
                </div>
              ))}
            </CardContent>
          </Card>
        </div>

        {/* Flow Builder */}
        <div className="lg:col-span-2">
          <Card className="border-border/60">
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center gap-2">
                  <Bot className="h-5 w-5" /> Flow Builder
                </CardTitle>
                <div className="flex gap-2">
                  <Button variant="outline" size="sm">
                    <Download className="h-4 w-4 mr-1" /> Import
                  </Button>
                  <Button variant="outline" size="sm">
                    <Copy className="h-4 w-4 mr-1" /> Duplicate
                  </Button>
                  <Button variant="primary" size="sm">
                    <Play className="h-4 w-4 mr-1" /> Test
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="bg-muted/50 rounded-lg min-h-[400px] p-8 relative">
                {/* Trigger Node */}
                <div className="flex flex-col items-center">
                  <div className="flex items-center gap-2 px-4 py-2 bg-blue-500 text-white rounded-full">
                    <MessageSquare className="h-4 w-4" />
                    <span className="text-sm font-medium">When user sends message</span>
                  </div>
                </div>

                <div className="flex justify-center my-4">
                  <ArrowRight className="h-6 w-6 text-muted-foreground" />
                </div>

                {/* Condition Node */}
                <div className="flex justify-center">
                  <div className="p-4 rounded-xl border-2 border-purple-500 bg-purple-50 min-w-[200px]">
                    <div className="flex items-center gap-2 mb-2">
                      <GitBranch className="h-4 w-4 text-purple-600" />
                      <span className="font-medium text-sm">Check Intent</span>
                    </div>
                    <div className="space-y-1 text-xs text-muted-foreground">
                      <p>+ Greeting detected</p>
                      <p>+ Order inquiry</p>
                      <p>+ Support request</p>
                    </div>
                  </div>
                </div>

                <div className="flex justify-center gap-8 my-4">
                  <div className="flex flex-col items-center">
                    <div className="h-8 border-l border-muted-foreground/30" />
                    <div className="px-3 py-1 bg-green-50 border border-green-500 rounded text-sm">Greeting</div>
                  </div>
                  <div className="flex flex-col items-center">
                    <div className="h-8 border-l border-muted-foreground/30" />
                    <div className="px-3 py-1 bg-blue-50 border border-blue-500 rounded text-sm">Order Info</div>
                  </div>
                  <div className="flex flex-col items-center">
                    <div className="h-8 border-l border-muted-foreground/30" />
                    <div className="px-3 py-1 bg-amber-50 border border-amber-500 rounded text-sm">Support</div>
                  </div>
                </div>

                {/* Add Node Button */}
                <div className="flex justify-center mt-8">
                  <Button variant="outline" size="sm" leftIcon={<Plus className="h-4 w-4" />}>
                    Add Node
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Bot Stats */}
          {selectedBotData?.status === "active" && (
            <Card className="border-border/60 mt-6">
              <CardHeader>
                <CardTitle className="text-base">Performance</CardTitle>
              </CardHeader>
              <CardContent className="grid grid-cols-4 gap-4">
                <div className="text-center">
                  <p className="text-2xl font-bold">{selectedBotData.conversations.toLocaleString()}</p>
                  <p className="text-sm text-muted-foreground">Conversations</p>
                </div>
                <div className="text-center">
                  <p className="text-2xl font-bold">{selectedBotData.satisfaction}%</p>
                  <p className="text-sm text-muted-foreground">Satisfaction</p>
                </div>
                <div className="text-center">
                  <p className="text-2xl font-bold">1.2</p>
                  <p className="text-sm text-muted-foreground">Avg. Response Time</p>
                </div>
                <div className="text-center">
                  <p className="text-2xl font-bold">78%</p>
                  <p className="text-sm text-muted-foreground">Resolution Rate</p>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}
