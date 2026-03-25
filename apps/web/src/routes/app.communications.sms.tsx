import {
  Badge,
  Button,
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  EmptyState,
  FormField,
  FormModal,
  Input,
  Textarea,
} from "@crm/ui";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { createFileRoute, useNavigate, useSearch } from "@tanstack/react-router";
import { MessageSquare, Plus, Search, Send } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { z } from "zod";
import { Pagination } from "@/components/ui/pagination";
import { communicationsApi } from "@/lib/api";

const searchSchema = z.object({
  q: z.string().optional(),
  page: z.number().optional().default(1),
});

export const Route = createFileRoute("/app/communications/sms")({
  validateSearch: searchSchema,
  component: SmsPage,
});

const STATUS_COLORS: Record<string, string> = {
  draft: "bg-muted text-muted-foreground",
  scheduled: "bg-blue-500/20 text-blue-400",
  running: "bg-yellow-500/20 text-yellow-400",
  completed: "bg-green-500/20 text-green-400",
  paused: "bg-orange-500/20 text-orange-400",
};

const PAGE_SIZE = 20;

function SmsPage() {
  const { q = "", page = 1 } = useSearch({ from: "/app/communications/sms" });
  const navigate = useNavigate({ from: "/app/communications/sms" });
  const setQ = (v: string) =>
    navigate({ search: (p) => ({ ...p, q: v, page: 1 }) });
  const setPage = (v: number) =>
    navigate({ search: (p) => ({ ...p, page: v }) });

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [form, setForm] = useState({ name: "", body: "", fromNumber: "" });
  const queryClient = useQueryClient();

  const { data, isLoading, isError } = useQuery({
    queryKey: ["communications", "campaigns", page],
    queryFn: () => communicationsApi.campaigns.list({ page, limit: PAGE_SIZE }),
    placeholderData: (prev) => prev,
  });

  const campaigns: any[] = data?.data ?? [];
  const total = (data as any)?.total ?? (data as any)?.pagination?.total ?? campaigns.length;
  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));

  const createMutation = useMutation({
    mutationFn: (payload: typeof form) =>
      communicationsApi.campaigns.create({
        name: payload.name,
        body: payload.body,
        fromNumber: payload.fromNumber || undefined,
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["communications", "campaigns"] });
      toast.success("Campaign created");
      setIsModalOpen(false);
      setForm({ name: "", body: "", fromNumber: "" });
    },
    onError: () => toast.error("Failed to create campaign"),
  });

  const filtered = campaigns.filter((c) =>
    !q || c.name?.toLowerCase().includes(q.toLowerCase()),
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <MessageSquare className="h-6 w-6 text-green-400" />
            SMS Campaigns
          </h1>
          <p className="text-muted-foreground mt-1">
            Create and manage outbound SMS messaging campaigns
          </p>
        </div>
        <Button onClick={() => setIsModalOpen(true)}>
          <Plus className="h-4 w-4 mr-2" />
          New Campaign
        </Button>
      </div>

      {/* Search */}
      <div className="relative max-w-sm">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          className="pl-9"
          placeholder="Search campaigns..."
          value={q}
          onChange={(e) => setQ(e.target.value)}
        />
      </div>

      {/* Content */}
      {isLoading ? (
        <div className="space-y-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="animate-pulse rounded-lg bg-muted h-24" />
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <EmptyState
          icon={<MessageSquare className="h-10 w-10 text-muted-foreground" />}
          title="No SMS campaigns"
          description="Create your first SMS campaign to reach your audience."
        />
      ) : (
        <div className="space-y-3">
          {filtered.map((campaign) => (
            <Card
              key={campaign.id}
              className="hover:border-primary/40 transition-colors"
            >
              <CardContent className="p-4">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <Send className="h-4 w-4 text-green-400 shrink-0" />
                      <p className="font-medium text-sm truncate">{campaign.name}</p>
                    </div>
                    <p className="text-xs text-muted-foreground line-clamp-2">
                      {campaign.body}
                    </p>
                    <p className="text-xs text-muted-foreground mt-1">
                      Recipients: {campaign.recipientCount ?? "0"}
                    </p>
                  </div>
                  <div className="flex flex-col items-end gap-1 shrink-0">
                    <span
                      className={`text-xs px-2 py-0.5 rounded-full font-medium ${STATUS_COLORS[campaign.status] ?? ""}`}
                    >
                      {campaign.status}
                    </span>
                    <span className="text-xs text-muted-foreground">
                      {new Date(campaign.createdAt).toLocaleDateString()}
                    </span>
                  </div>
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

      <Pagination page={page} totalPages={totalPages} onPageChange={setPage} />

      {/* Create modal */}
      <FormModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title="New SMS Campaign"
        onSubmit={() => createMutation.mutate(form)}
        isLoading={createMutation.isPending}
        submitText="Create Campaign"
      >
        <FormField label="Campaign name" required>
          <Input
            placeholder="e.g. Welcome Series"
            value={form.name}
            onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
          />
        </FormField>
        <FormField label="Message body" required>
          <Textarea
            placeholder="Your SMS message (max 160 chars per segment)"
            value={form.body}
            onChange={(e) => setForm((f) => ({ ...f, body: e.target.value }))}
            rows={3}
          />
        </FormField>
        <FormField label="From number (optional)">
          <Input
            placeholder="+15551234567"
            value={form.fromNumber}
            onChange={(e) => setForm((f) => ({ ...f, fromNumber: e.target.value }))}
          />
        </FormField>
      </FormModal>
    </div>
  );
}
