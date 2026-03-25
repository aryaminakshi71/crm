import {
  Badge,
  Button,
  Card,
  CardContent,
  EmptyState,
  FormField,
  FormModal,
  Input,
  Loading,
  Textarea,
} from "@crm/ui";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { createFileRoute, useSearch, useNavigate } from "@tanstack/react-router";
import {
  Copy,
  MessageSquareText,
  Plus,
  Search,
  Tag,
  Trash2,
  Zap,
} from "lucide-react";
import { useMemo, useState } from "react";
import { z } from "zod";
import { toast } from "sonner";
import { helpdeskApi } from "@/lib/api";

const searchSchema = z.object({
  q: z.string().optional(),
  category: z.string().optional(),
});

export const Route = createFileRoute("/app/helpdesk/canned/_index")({
  validateSearch: searchSchema,
  component: CannedResponsesPage,
});

function CannedResponsesPage() {
  const { q: search = "", category: categoryFilter = "all" } = useSearch({ from: "/app/helpdesk/canned/_index" });
  const navigate = useNavigate({ from: "/app/helpdesk/canned/_index" });
  const setSearch = (v: string) => navigate({ search: (p) => ({ ...p, q: v }) });
  const setCategoryFilter = (v: string) => navigate({ search: (p) => ({ ...p, category: v }) });
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [newResponse, setNewResponse] = useState({
    name: "",
    body: "",
    category: "",
    shortcut: "",
  });
  const qc = useQueryClient();

  const { data, isLoading } = useQuery({
    queryKey: ["helpdesk-canned"],
    queryFn: () => helpdeskApi.canned.list({ page: 1, limit: 100 }),
  });

  const createResponse = useMutation({
    mutationFn: (payload: { name: string; body: string; category?: string; shortcut?: string }) =>
      helpdeskApi.canned.create(payload),
    onSuccess: () => {
      toast.success("Canned response created");
      qc.invalidateQueries({ queryKey: ["helpdesk-canned"] });
      setIsCreateOpen(false);
      setNewResponse({ name: "", body: "", category: "", shortcut: "" });
    },
    onError: (e: Error) => toast.error(e.message || "Failed to create canned response"),
  });

  const deleteResponse = useMutation({
    mutationFn: (id: string) => helpdeskApi.canned.delete(id),
    onSuccess: () => {
      toast.success("Canned response deleted");
      qc.invalidateQueries({ queryKey: ["helpdesk-canned"] });
    },
    onError: (e: Error) => toast.error(e.message || "Failed to delete canned response"),
  });

  const responses: any[] = (data as any)?.data ?? [];

  const categories = Array.from(new Set(responses.map((r: any) => r.category).filter(Boolean))) as string[];
  const totalUses = responses.reduce((s: number, r: any) => s + (Number(r.useCount) || 0), 0);
  const mostUsed = responses.reduce(
    (best: any, r: any) => ((Number(r.useCount) || 0) > (Number(best?.useCount) || 0) ? r : best),
    null
  );

  const filtered = useMemo(() => {
    return responses.filter((r: any) => {
      if (categoryFilter !== "all" && r.category !== categoryFilter) return false;
      if (!search.trim()) return true;
      const s = search.toLowerCase();
      return [r.name, r.body, r.category, r.shortcut].some((v) => String(v ?? "").toLowerCase().includes(s));
    });
  }, [responses, search, categoryFilter]);

  if (isLoading) return <Loading text="Loading canned responses..." />;

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2 text-foreground">
            <MessageSquareText className="h-6 w-6" /> Canned Responses
          </h1>
          <p className="text-muted-foreground text-sm">Pre-written responses to speed up support replies.</p>
        </div>
        <Button variant="primary" leftIcon={<Plus className="h-4 w-4" />} onClick={() => setIsCreateOpen(true)}>
          New Response
        </Button>
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
        <Metric title="Total Responses" value={responses.length} icon={<MessageSquareText className="h-4 w-4" />} color="text-primary" />
        <Metric title="Total Uses" value={totalUses.toLocaleString()} icon={<Copy className="h-4 w-4" />} color="text-cyan-400" />
        <Metric
          title="Categories"
          value={categories.length}
          icon={<Tag className="h-4 w-4" />}
          trend={mostUsed ? `Most used: ${mostUsed.name}` : undefined}
          color="text-violet-400"
        />
      </div>

      <div className="flex flex-wrap gap-3">
        <div className="relative max-w-sm w-full">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search title, content, shortcut..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9"
          />
        </div>
        <select
          value={categoryFilter}
          onChange={(e) => setCategoryFilter(e.target.value)}
          className="flex h-10 rounded-lg border border-border bg-card px-3 py-2 text-sm"
        >
          <option value="all">All categories</option>
          {categories.map((cat) => (
            <option key={cat} value={cat}>{cat}</option>
          ))}
        </select>
      </div>

      <Card>
        <CardContent className="p-0">
          {filtered.length === 0 ? (
            <EmptyState
              icon={<MessageSquareText className="h-12 w-12" />}
              title="No canned responses found"
              description={search ? "Try adjusting your search." : "Create your first canned response to speed up replies."}
              action={<Button onClick={() => setIsCreateOpen(true)}>New Response</Button>}
            />
          ) : (
            <div className="divide-y divide-border">
              {filtered.map((response: any) => (
                <div key={response.id} className="p-4 hover:bg-muted/20 transition-colors">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <p className="font-medium text-foreground">{response.name}</p>
                        {response.shortcut && (
                          <code className="text-xs bg-muted px-1.5 py-0.5 rounded font-mono text-primary">
                            /{response.shortcut}
                          </code>
                        )}
                        {response.useCount != null && (
                          <span className="text-xs text-muted-foreground">{response.useCount} uses</span>
                        )}
                      </div>
                      <p className="text-sm text-muted-foreground mt-1 line-clamp-2 leading-relaxed">
                        {response.body}
                      </p>
                    </div>
                    <div className="flex items-center gap-2 shrink-0 ml-2">
                      {response.category && <Badge variant="outline">{response.category}</Badge>}
                      <Button
                        size="sm"
                        variant="ghost"
                        leftIcon={<Copy className="h-3.5 w-3.5" />}
                        onClick={() => {
                          navigator.clipboard.writeText(response.body ?? "");
                          toast.success("Copied to clipboard");
                        }}
                      >
                        Copy
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        leftIcon={<Trash2 className="h-3.5 w-3.5" />}
                        onClick={() => deleteResponse.mutate(response.id)}
                        loading={deleteResponse.isPending}
                      >
                        Delete
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <FormModal
        isOpen={isCreateOpen}
        onClose={() => setIsCreateOpen(false)}
        title="New Canned Response"
        submitText="Create Response"
        loading={createResponse.isPending}
        onSubmit={(e) => {
          e.preventDefault();
          if (!newResponse.name.trim()) {
            toast.error("Response name is required");
            return;
          }
          if (!newResponse.body.trim()) {
            toast.error("Response body is required");
            return;
          }
          createResponse.mutate({
            name: newResponse.name.trim(),
            body: newResponse.body.trim(),
            category: newResponse.category.trim() || undefined,
            shortcut: newResponse.shortcut.trim() || undefined,
          });
        }}
      >
        <div className="space-y-4">
          <FormField label="Response Name" required>
            <Input
              value={newResponse.name}
              onChange={(e) => setNewResponse((p) => ({ ...p, name: e.target.value }))}
              placeholder="Billing Inquiry - Standard"
              required
            />
          </FormField>
          <FormField label="Message Body" required>
            <Textarea
              value={newResponse.body}
              onChange={(e) => setNewResponse((p) => ({ ...p, body: e.target.value }))}
              placeholder="Thank you for reaching out. I can help you with your billing question..."
              rows={5}
            />
          </FormField>
          <div className="grid grid-cols-2 gap-4">
            <FormField label="Category">
              <Input
                value={newResponse.category}
                onChange={(e) => setNewResponse((p) => ({ ...p, category: e.target.value }))}
                placeholder="Billing, Technical, General..."
              />
            </FormField>
            <FormField label="Shortcut">
              <Input
                value={newResponse.shortcut}
                onChange={(e) => setNewResponse((p) => ({ ...p, shortcut: e.target.value }))}
                placeholder="billing-inquiry"
              />
            </FormField>
          </div>
        </div>
      </FormModal>
    </div>
  );
}

function Metric({
  title,
  value,
  icon,
  trend,
  color,
}: {
  title: string;
  value: string | number;
  icon?: React.ReactNode;
  trend?: string;
  color?: string;
}) {
  return (
    <Card className="border-border/60">
      <CardContent className="p-4">
        <div className="flex items-center justify-between gap-3">
          <div>
            <p className="text-muted-foreground text-[10px] font-black uppercase tracking-widest">{title}</p>
            <p className="font-black text-2xl text-foreground mt-0.5">{value}</p>
            {trend && (
              <div className="mt-2 flex items-center gap-1.5">
                <Zap className="h-2.5 w-2.5 text-primary/40" />
                <span className="text-[9px] font-bold text-muted-foreground/60">{trend}</span>
              </div>
            )}
          </div>
          <div className={`rounded-xl bg-muted/30 p-2.5 ${color ?? "text-primary"}`}>
            {icon ?? <MessageSquareText className="h-4 w-4" />}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
