import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@crm/ui";
import { useQuery } from "@tanstack/react-query";
import { Link, createFileRoute } from "@tanstack/react-router";
import {
  Bot,
  Hash,
  LayoutList,
  MessageCircle,
  MessageSquare,
  Phone,
  FileText,
} from "lucide-react";
import { communicationsApi } from "../lib/api";

export const Route = createFileRoute("/app/communications/")({
  component: CommunicationsIndexPage,
});

function CommunicationsIndexPage() {
  const { data, isLoading } = useQuery({
    queryKey: ["communications", "summary"],
    queryFn: () => communicationsApi.summary(),
  });

  const summary = data ?? {
    conversations: 0,
    messages: 0,
    phoneNumbers: 0,
    queues: 0,
    campaigns: 0,
    templates: 0,
    bots: 0,
  };

  const tiles = [
    {
      label: "Live Chat",
      description: "Manage real-time conversations",
      icon: MessageCircle,
      count: summary.conversations,
      href: "/app/communications/chat",
      color: "text-cyan-400",
    },
    {
      label: "SMS Campaigns",
      description: "Outbound SMS messaging",
      icon: MessageSquare,
      count: summary.campaigns,
      href: "/app/communications/sms",
      color: "text-green-400",
    },
    {
      label: "Templates",
      description: "Reusable message templates",
      icon: FileText,
      count: summary.templates,
      href: "/app/communications/templates",
      color: "text-purple-400",
    },
    {
      label: "Phone Numbers",
      description: "Manage provisioned numbers",
      icon: Phone,
      count: summary.phoneNumbers,
      href: "/app/communications/numbers",
      color: "text-blue-400",
    },
    {
      label: "Queues",
      description: "Inbound routing queues",
      icon: LayoutList,
      count: summary.queues,
      href: "/app/communications/queue",
      color: "text-orange-400",
    },
    {
      label: "Chatbots",
      description: "AI-powered bots",
      icon: Bot,
      count: summary.bots,
      href: "/app/communications/chatbot",
      color: "text-pink-400",
    },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Communications</h1>
        <p className="text-muted-foreground mt-1">
          Unified inbox for chat, SMS, voice and AI-powered bots.
        </p>
      </div>

      {isLoading ? (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="animate-pulse rounded-lg bg-muted h-28" />
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {tiles.map((tile) => {
            const Icon = tile.icon;
            return (
              <Link key={tile.label} to={tile.href}>
                <Card className="hover:border-primary/50 transition-colors cursor-pointer">
                  <CardHeader className="flex flex-row items-center justify-between pb-2">
                    <CardTitle className="text-sm font-medium">
                      {tile.label}
                    </CardTitle>
                    <Icon className={`h-5 w-5 ${tile.color}`} />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">{tile.count}</div>
                    <p className="text-xs text-muted-foreground mt-1">
                      {tile.description}
                    </p>
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
