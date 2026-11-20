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
import { FileText, Plus, Search, Trash2 } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { communicationsApi } from "@/lib/api";

export const Route = createFileRoute("/app/communications/templates")({
  component: TemplatesPage,
});

const CHANNEL_COLORS: Record<string, string> = {
  sms: "bg-green-500/20 text-green-400",
  email: "bg-blue-500/20 text-blue-400",
  chat: "bg-cyan-500/20 text-cyan-400",
};

function TemplatesPage() {
  const [search, setSearch] = useState("");
  const [channelFilter, setChannelFilter] = useState("all");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [form, setForm] = useState({
    name: "",
    channel: "sms" as "sms" | "email" | "chat",
    category: "",
    body: "",
  });
  const queryClient = useQueryClient();

  const { data, isLoading, isError } = useQuery({
    queryKey: ["communications", "templates", channelFilter],
    queryFn: () =>
      communicationsApi.templates.list({
        page: 1,
        limit: 100,
        channel: channelFilter !== "all" ? channelFilter : undefined,
      }),
    placeholderData: (prev) => prev,
  });

  const templates: any[] = data?.data ?? [];

  const createMutation = useMutation({
    mutationFn: (payload: typeof form) =>
      communicationsApi.templates.create({
        name: payload.name,
        channel: payload.channel,
        category: payload.category || undefined,
        body: payload.body,
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["communications", "templates"] });
      toast.success("Template created");
      setIsModalOpen(false);
      setForm({ name: "", channel: "sms", category: "", body: "" });
    },
    onError: () => toast.error("Failed to create template"),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => communicationsApi.templates.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["communications", "templates"] });
      toast.success("Template deleted");
    },
    onError: () => toast.error("Failed to delete template"),
  });

  const filtered = templates.filter((t) => {
    const matchSearch =
      !search || t.name?.toLowerCase().includes(search.toLowerCase());
    const matchChannel = channelFilter === "all" || t.channel === channelFilter;
    return matchSearch && matchChannel;
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <FileText className="h-6 w-6 text-purple-400" />
            Message Templates
          </h1>
          <p className="text-muted-foreground mt-1">
            Reusable templates for SMS, email and chat channels
          </p>
        </div>
        <Button onClick={() => setIsModalOpen(true)}>
          <Plus className="h-4 w-4 mr-2" />
          New Template
        </Button>
      </div>

      {/* Filters */}
      <div className="flex gap-3 flex-wrap">
        <div className="relative flex-1 min-w-48">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            className="pl-9"
            placeholder="Search templates..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        {(["all", "sms", "email", "chat"] as const).map((ch) => (
          <Button
            key={ch}
            variant={channelFilter === ch ? "primary" : "outline"}
            size="sm"
            onClick={() => setChannelFilter(ch)}
          >
            {ch === "all" ? "All" : ch.toUpperCase()}
          </Button>
        ))}
      </div>

      {/* Content */}
      {isLoading ? (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="animate-pulse rounded-lg bg-muted h-36" />
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <EmptyState
          icon={<FileText className="h-10 w-10 text-muted-foreground" />}
          title="No templates"
          description="Create reusable templates to speed up messaging."
        />
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {filtered.map((tpl) => (
            <Card key={tpl.id} className="hover:border-primary/40 transition-colors">
              <CardContent className="p-4 space-y-3">
                <div className="flex items-start justify-between gap-2">
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-sm truncate">{tpl.name}</p>
                    {tpl.category && (
                      <p className="text-xs text-muted-foreground">{tpl.category}</p>
                    )}
                  </div>
                  <div className="flex items-center gap-1 shrink-0">
                    <span
                      className={`text-xs px-2 py-0.5 rounded-full font-medium ${CHANNEL_COLORS[tpl.channel] ?? ""}`}
                    >
                      {tpl.channel?.toUpperCase()}
                    </span>
                  </div>
                </div>
                <p className="text-xs text-muted-foreground line-clamp-3 bg-muted/50 rounded p-2 font-mono">
                  {tpl.body}
                </p>
                <div className="flex items-center justify-between">
                  <span className="text-xs text-muted-foreground">
                    {new Date(tpl.createdAt).toLocaleDateString()}
                  </span>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-7 w-7 text-destructive hover:text-destructive"
                    onClick={() => deleteMutation.mutate(tpl.id)}
                    disabled={deleteMutation.isPending}
                  >
                    <Trash2 className="h-3.5 w-3.5" />
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
        title="New Message Template"
        onSubmit={() => createMutation.mutate(form)}
        isLoading={createMutation.isPending}
        submitText="Create Template"
      >
        <FormField label="Template name" required>
          <Input
            placeholder="e.g. Welcome Message"
            value={form.name}
            onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
          />
        </FormField>
        <FormField label="Channel" required>
          <select
            className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
            value={form.channel}
            onChange={(e) =>
              setForm((f) => ({
                ...f,
                channel: e.target.value as "sms" | "email" | "chat",
              }))
            }
          >
            <option value="sms">SMS</option>
            <option value="email">Email</option>
            <option value="chat">Chat</option>
          </select>
        </FormField>
        <FormField label="Category">
          <Input
            placeholder="e.g. onboarding, reminders"
            value={form.category}
            onChange={(e) => setForm((f) => ({ ...f, category: e.target.value }))}
          />
        </FormField>
        <FormField label="Message body" required>
          <Textarea
            placeholder="Use {{variable}} for dynamic values"
            value={form.body}
            onChange={(e) => setForm((f) => ({ ...f, body: e.target.value }))}
            rows={4}
          />
        </FormField>
      </FormModal>
    </div>
  );
}
