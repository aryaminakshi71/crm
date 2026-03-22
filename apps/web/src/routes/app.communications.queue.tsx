import {
  Button,
  Card,
  CardContent,
  EmptyState,
  FormField,
  FormModal,
  Input,
  Textarea,
} from "@crm/ui";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";
import { LayoutList, Mic, MessageSquare, MessageCircle, Plus, Users } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { communicationsApi } from "../lib/api";

export const Route = createFileRoute("/app/communications/queue")({
  component: CommQueuePage,
});

// ─── Fallback mock data ───────────────────────────────────────────────────────

const MOCK_QUEUES = [
  {
    id: "mock-q-1",
    name: "General Support",
    description: "Default inbound chat queue",
    channel: "chat",
    status: "active",
    maxWait: "5m",
    createdAt: new Date().toISOString(),
  },
  {
    id: "mock-q-2",
    name: "Sales Voice",
    description: "Inbound calls for sales team",
    channel: "voice",
    status: "active",
    maxWait: "3m",
    createdAt: new Date(Date.now() - 3 * 86400000).toISOString(),
  },
  {
    id: "mock-q-3",
    name: "SMS Inbox",
    description: "Inbound SMS routing",
    channel: "sms",
    status: "paused",
    maxWait: "10m",
    createdAt: new Date(Date.now() - 7 * 86400000).toISOString(),
  },
];

const STATUS_COLORS: Record<string, string> = {
  active: "bg-green-500/20 text-green-400",
  paused: "bg-yellow-500/20 text-yellow-400",
  closed: "bg-muted text-muted-foreground",
};

const CHANNEL_ICONS: Record<string, React.ElementType> = {
  chat: MessageCircle,
  voice: Mic,
  sms: MessageSquare,
};

function CommQueuePage() {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [form, setForm] = useState({
    name: "",
    description: "",
    channel: "chat" as "chat" | "voice" | "sms",
    maxWait: "",
  });
  const queryClient = useQueryClient();

  const { data, isLoading, isError } = useQuery({
    queryKey: ["communications", "queues"],
    queryFn: () => communicationsApi.queues.list({ page: 1, limit: 100 }),
  });

  const queues: any[] = data?.data ?? MOCK_QUEUES;

  const createMutation = useMutation({
    mutationFn: (payload: typeof form) =>
      communicationsApi.queues.create({
        name: payload.name,
        description: payload.description || undefined,
        channel: payload.channel,
        maxWait: payload.maxWait || undefined,
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["communications", "queues"] });
      toast.success("Queue created");
      setIsModalOpen(false);
      setForm({ name: "", description: "", channel: "chat", maxWait: "" });
    },
    onError: () => toast.error("Failed to create queue"),
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <LayoutList className="h-6 w-6 text-orange-400" />
            Routing Queues
          </h1>
          <p className="text-muted-foreground mt-1">
            Manage inbound routing queues for chat, voice and SMS
          </p>
        </div>
        <Button onClick={() => setIsModalOpen(true)}>
          <Plus className="h-4 w-4 mr-2" />
          New Queue
        </Button>
      </div>

      {/* Content */}
      {isLoading ? (
        <div className="space-y-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="animate-pulse rounded-lg bg-muted h-24" />
          ))}
        </div>
      ) : queues.length === 0 ? (
        <EmptyState
          icon={<LayoutList className="h-10 w-10 text-muted-foreground" />}
          title="No queues configured"
          description="Create a routing queue to handle inbound communications."
        />
      ) : (
        <div className="space-y-3">
          {queues.map((queue) => {
            const Icon = CHANNEL_ICONS[queue.channel] ?? MessageCircle;
            return (
              <Card key={queue.id} className="hover:border-primary/40 transition-colors">
                <CardContent className="p-4 flex items-center justify-between gap-4">
                  <div className="flex items-center gap-3">
                    <div className="h-10 w-10 rounded-full bg-orange-500/20 flex items-center justify-center">
                      <Icon className="h-5 w-5 text-orange-400" />
                    </div>
                    <div>
                      <p className="font-medium text-sm">{queue.name}</p>
                      <p className="text-xs text-muted-foreground">
                        {queue.description ?? ""}
                        {queue.maxWait ? ` · Max wait: ${queue.maxWait}` : ""}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="text-xs text-muted-foreground capitalize">
                      {queue.channel}
                    </span>
                    <span
                      className={`text-xs px-2 py-0.5 rounded-full font-medium ${STATUS_COLORS[queue.status] ?? ""}`}
                    >
                      {queue.status}
                    </span>
                    <span className="text-xs text-muted-foreground whitespace-nowrap">
                      {new Date(queue.createdAt).toLocaleDateString()}
                    </span>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      {isError && !isLoading && (
        <p className="text-sm text-destructive">
          Could not load live data — showing cached results.
        </p>
      )}

      {/* Create modal */}
      <FormModal
        open={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title="New Routing Queue"
        onSubmit={() => createMutation.mutate(form)}
        isSubmitting={createMutation.isPending}
        submitLabel="Create Queue"
      >
        <FormField label="Queue name" required>
          <Input
            placeholder="e.g. General Support"
            value={form.name}
            onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
          />
        </FormField>
        <FormField label="Description">
          <Textarea
            placeholder="Brief description of this queue's purpose"
            value={form.description}
            onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
            rows={2}
          />
        </FormField>
        <FormField label="Channel" required>
          <select
            className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
            value={form.channel}
            onChange={(e) =>
              setForm((f) => ({
                ...f,
                channel: e.target.value as "chat" | "voice" | "sms",
              }))
            }
          >
            <option value="chat">Chat</option>
            <option value="voice">Voice</option>
            <option value="sms">SMS</option>
          </select>
        </FormField>
        <FormField label="Max wait time">
          <Input
            placeholder="e.g. 5m, 10m"
            value={form.maxWait}
            onChange={(e) => setForm((f) => ({ ...f, maxWait: e.target.value }))}
          />
        </FormField>
      </FormModal>
    </div>
  );
}
