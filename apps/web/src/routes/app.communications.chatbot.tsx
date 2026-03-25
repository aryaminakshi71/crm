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
import { Bot, Plus, Power, PowerOff, Zap } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { communicationsApi } from "@/lib/api";

export const Route = createFileRoute("/app/communications/chatbot")({
  component: ChatbotPage,
});

const STATUS_COLORS: Record<string, string> = {
  active: "bg-green-500/20 text-green-400",
  inactive: "bg-muted text-muted-foreground",
  training: "bg-blue-500/20 text-blue-400",
};

function ChatbotPage() {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [form, setForm] = useState({
    name: "",
    description: "",
    channel: "chat" as "chat" | "sms" | "voice",
    systemPrompt: "",
    model: "gpt-4o-mini",
    handoffThreshold: "0.7",
  });
  const queryClient = useQueryClient();

  const { data, isLoading, isError } = useQuery({
    queryKey: ["communications", "bots"],
    queryFn: () => communicationsApi.bots.list({ page: 1, limit: 100 }),
    placeholderData: (prev) => prev,
  });

  const bots: any[] = data?.data ?? [];

  const createMutation = useMutation({
    mutationFn: (payload: typeof form) =>
      communicationsApi.bots.create({
        name: payload.name,
        description: payload.description || undefined,
        channel: payload.channel,
        systemPrompt: payload.systemPrompt || undefined,
        model: payload.model,
        handoffThreshold: payload.handoffThreshold,
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["communications", "bots"] });
      toast.success("Bot created");
      setIsModalOpen(false);
      setForm({
        name: "",
        description: "",
        channel: "chat",
        systemPrompt: "",
        model: "gpt-4o-mini",
        handoffThreshold: "0.7",
      });
    },
    onError: () => toast.error("Failed to create bot"),
  });

  const toggleMutation = useMutation({
    mutationFn: (bot: any) =>
      communicationsApi.bots.update(bot.id, {
        status: bot.status === "active" ? "inactive" : "active",
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["communications", "bots"] });
      toast.success("Bot status updated");
    },
    onError: () => toast.error("Failed to update bot"),
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <Bot className="h-6 w-6 text-pink-400" />
            Chatbots
          </h1>
          <p className="text-muted-foreground mt-1">
            Configure AI-powered bots for automated conversations
          </p>
        </div>
        <Button onClick={() => setIsModalOpen(true)}>
          <Plus className="h-4 w-4 mr-2" />
          New Bot
        </Button>
      </div>

      {/* Content */}
      {isLoading ? (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          {Array.from({ length: 2 }).map((_, i) => (
            <div key={i} className="animate-pulse rounded-lg bg-muted h-40" />
          ))}
        </div>
      ) : bots.length === 0 ? (
        <EmptyState
          icon={<Bot className="h-10 w-10 text-muted-foreground" />}
          title="No chatbots configured"
          description="Create an AI bot to automate conversations on chat, SMS or voice."
        />
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          {bots.map((bot) => (
            <Card key={bot.id} className="hover:border-primary/40 transition-colors">
              <CardContent className="p-5 space-y-3">
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <div className="h-9 w-9 rounded-full bg-pink-500/20 flex items-center justify-center shrink-0">
                      <Bot className="h-4 w-4 text-pink-400" />
                    </div>
                    <div>
                      <p className="font-medium text-sm">{bot.name}</p>
                      <p className="text-xs text-muted-foreground capitalize">
                        {bot.channel} · {bot.model}
                      </p>
                    </div>
                  </div>
                  <span
                    className={`text-xs px-2 py-0.5 rounded-full font-medium shrink-0 ${STATUS_COLORS[bot.status] ?? ""}`}
                  >
                    {bot.status}
                  </span>
                </div>

                {bot.description && (
                  <p className="text-xs text-muted-foreground">{bot.description}</p>
                )}

                <div className="flex items-center gap-1 text-xs text-muted-foreground">
                  <Zap className="h-3 w-3" />
                  <span>Handoff at {Math.round(Number(bot.handoffThreshold) * 100)}% confidence</span>
                </div>

                <div className="flex items-center justify-between pt-1">
                  <span className="text-xs text-muted-foreground">
                    {new Date(bot.createdAt).toLocaleDateString()}
                  </span>
                  <Button
                    variant="outline"
                    size="sm"
                    className="h-7 text-xs gap-1"
                    onClick={() => toggleMutation.mutate(bot)}
                    disabled={toggleMutation.isPending}
                  >
                    {bot.status === "active" ? (
                      <>
                        <PowerOff className="h-3 w-3" />
                        Deactivate
                      </>
                    ) : (
                      <>
                        <Power className="h-3 w-3" />
                        Activate
                      </>
                    )}
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {isError && !isLoading && (
        <p className="text-sm text-destructive">
          Could not load live data — showing cached results.
        </p>
      )}

      {/* Create modal */}
      <FormModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title="Create Chatbot"
        onSubmit={() => createMutation.mutate(form)}
        isLoading={createMutation.isPending}
        submitText="Create Bot"
      >
        <FormField label="Bot name" required>
          <Input
            placeholder="e.g. Support Bot"
            value={form.name}
            onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
          />
        </FormField>
        <FormField label="Description">
          <Input
            placeholder="What does this bot do?"
            value={form.description}
            onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
          />
        </FormField>
        <FormField label="Channel" required>
          <select
            className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
            value={form.channel}
            onChange={(e) =>
              setForm((f) => ({
                ...f,
                channel: e.target.value as "chat" | "sms" | "voice",
              }))
            }
          >
            <option value="chat">Chat</option>
            <option value="sms">SMS</option>
            <option value="voice">Voice</option>
          </select>
        </FormField>
        <FormField label="AI Model">
          <select
            className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
            value={form.model}
            onChange={(e) => setForm((f) => ({ ...f, model: e.target.value }))}
          >
            <option value="gpt-4o-mini">GPT-4o mini</option>
            <option value="gpt-4o">GPT-4o</option>
            <option value="claude-3-haiku">Claude 3 Haiku</option>
            <option value="claude-3-sonnet">Claude 3 Sonnet</option>
          </select>
        </FormField>
        <FormField label="System prompt">
          <Textarea
            placeholder="Instructions for the bot's behavior and persona..."
            value={form.systemPrompt}
            onChange={(e) => setForm((f) => ({ ...f, systemPrompt: e.target.value }))}
            rows={4}
          />
        </FormField>
        <FormField label="Handoff threshold (0–1)">
          <Input
            type="number"
            min="0"
            max="1"
            step="0.05"
            placeholder="0.7"
            value={form.handoffThreshold}
            onChange={(e) => setForm((f) => ({ ...f, handoffThreshold: e.target.value }))}
          />
        </FormField>
      </FormModal>
    </div>
  );
}
