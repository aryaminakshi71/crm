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
} from "@crm/ui";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { createFileRoute, useNavigate, useSearch } from "@tanstack/react-router";
import { z } from "zod";
import {
  Clock,
  ListOrdered,
  Plus,
  Search,
  Timer,
  Users,
  Zap,
} from "lucide-react";
import { useMemo, useState } from "react";
import { toast } from "sonner";
import { helpdeskApi } from "@/lib/api";

const searchSchema = z.object({
  q: z.string().optional(),
  status: z.string().optional(),
  page: z.number().optional().default(1),
});

export const Route = createFileRoute("/app/helpdesk/queue/_index")({
  validateSearch: searchSchema,
  component: HelpdeskQueuePage,
});

function HelpdeskQueuePage() {
  const { q = "", status = "", page = 1 } = useSearch({ from: "/app/helpdesk/queue/_index" });
  const navigate = useNavigate({ from: "/app/helpdesk/queue/_index" });
  const setQ = (v: string) => navigate({ search: (p) => ({ ...p, q: v, page: 1 }) });
  const setStatus = (v: string) => navigate({ search: (p) => ({ ...p, status: v, page: 1 }) });
  const setPage = (v: number) => navigate({ search: (p) => ({ ...p, page: v }) });
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [newToken, setNewToken] = useState({ serviceType: "general", ticketId: "" });
  const qc = useQueryClient();

  const { data, isLoading } = useQuery({
    queryKey: ["helpdesk-queue-list"],
    queryFn: () => helpdeskApi.queue({ page: 1, limit: 100 }),
    refetchInterval: 30000,
  });

  const updateStatus = useMutation({
    mutationFn: ({ id, status, counter }: { id: string; status: string; counter?: string }) =>
      helpdeskApi.queue({ page: 1, limit: 100 }) as Promise<any>,
    onSuccess: () => {
      toast.success("Queue token updated");
      qc.invalidateQueries({ queryKey: ["helpdesk-queue-list"] });
    },
    onError: (e: Error) => toast.error(e.message || "Failed to update token"),
  });

  const tokens: any[] = (data as any)?.data ?? [];

  const waitingCount = tokens.filter((t: any) => t.status === "waiting").length;
  const calledCount = tokens.filter((t: any) => t.status === "called").length;
  const completedCount = tokens.filter((t: any) => t.status === "completed").length;
  const serviceTypes = Array.from(new Set(tokens.map((t: any) => t.serviceType).filter(Boolean)));

  const filtered = useMemo(() => {
    return tokens.filter((t: any) => {
      if (status && status !== "all" && t.status !== status) return false;
      if (!q.trim()) return true;
      const s = q.toLowerCase();
      return [t.tokenNumber, t.serviceType, t.counter, t.status]
        .some((v) => String(v ?? "").toLowerCase().includes(s));
    });
  }, [tokens, q, status]);

  if (isLoading) return <Loading text="Loading queue..." />;

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2 text-foreground">
            <ListOrdered className="h-6 w-6" /> Service Queue
          </h1>
          <p className="text-muted-foreground text-sm">Manage live service queue tokens and agent desks.</p>
        </div>
        <Button variant="primary" leftIcon={<Plus className="h-4 w-4" />} onClick={() => setIsCreateOpen(true)}>
          New Token
        </Button>
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-4">
        <Metric title="Total Tokens" value={tokens.length} icon={<ListOrdered className="h-4 w-4" />} color="text-primary" />
        <Metric title="Waiting" value={waitingCount} icon={<Clock className="h-4 w-4" />} color="text-amber-400" />
        <Metric title="Called" value={calledCount} icon={<Timer className="h-4 w-4" />} color="text-blue-400" />
        <Metric title="Completed" value={completedCount} icon={<Users className="h-4 w-4" />} color="text-emerald-400" />
      </div>

      <div className="flex flex-wrap gap-3">
        <div className="relative max-w-sm w-full">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search token number, service type..."
            value={q}
            onChange={(e) => setQ(e.target.value)}
            className="pl-9"
          />
        </div>
        {serviceTypes.length > 0 && (
          <div className="flex items-center gap-2 flex-wrap">
            {serviceTypes.map((st) => (
              <Badge key={st} variant="outline" className="cursor-pointer" onClick={() => setQ(st)}>
                {st}
              </Badge>
            ))}
          </div>
        )}
      </div>

      <Card>
        <CardContent className="p-0">
          {filtered.length === 0 ? (
            <EmptyState
              icon={<ListOrdered className="h-12 w-12" />}
              title="No queue tokens"
              description={q ? "Try adjusting your search." : "Create a token to start queue operations."}
              action={<Button onClick={() => setIsCreateOpen(true)}>New Token</Button>}
            />
          ) : (
            <div className="divide-y divide-border">
              {filtered.map((token: any) => (
                <div key={token.id} className="flex items-center justify-between p-4 hover:bg-muted/20 transition-colors">
                  <div className="min-w-0">
                    <p className="font-medium text-foreground">
                      Token #{token.tokenNumber ?? token.id?.slice(-4)} — {token.serviceType ?? "General"}
                    </p>
                    <div className="flex items-center gap-3 mt-0.5 flex-wrap">
                      {token.counter && (
                        <span className="text-xs text-muted-foreground">Counter: {token.counter}</span>
                      )}
                      {token.ticketId && (
                        <span className="text-xs text-muted-foreground">Ticket: {token.ticketId.slice(0, 8)}…</span>
                      )}
                      {token.createdAt && (
                        <span className="text-xs text-muted-foreground flex items-center gap-1">
                          <Clock className="h-3 w-3" />
                          {new Date(token.createdAt).toLocaleTimeString()}
                        </span>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-2 shrink-0 ml-2">
                    <Badge
                      variant={(token.status === "completed" ? "success" : token.status === "called" ? "primary" : "outline") as any}
                    >
                      {token.status ?? "waiting"}
                    </Badge>
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
        title="Create Queue Token"
        submitText="Create Token"
        loading={false}
        onSubmit={(e) => {
          e.preventDefault();
          if (!newToken.serviceType.trim()) {
            toast.error("Service type is required");
            return;
          }
          toast.info("Queue token creation requires the queue management API. Contact your administrator.");
          setIsCreateOpen(false);
        }}
      >
        <div className="space-y-4">
          <FormField label="Service Type" required>
            <select
              className="flex h-10 w-full rounded-lg border border-border bg-card px-3 py-2 text-sm"
              value={newToken.serviceType}
              onChange={(e) => setNewToken((p) => ({ ...p, serviceType: e.target.value }))}
            >
              <option value="general">General</option>
              <option value="billing">Billing</option>
              <option value="technical">Technical</option>
              <option value="onboarding">Onboarding</option>
              <option value="returns">Returns</option>
            </select>
          </FormField>
          <FormField label="Related Ticket ID">
            <Input
              value={newToken.ticketId}
              onChange={(e) => setNewToken((p) => ({ ...p, ticketId: e.target.value }))}
              placeholder="Optional ticket UUID"
            />
          </FormField>
        </div>
      </FormModal>
    </div>
  );
}

function Metric({
  title,
  value,
  icon,
  color,
}: {
  title: string;
  value: string | number;
  icon?: React.ReactNode;
  color?: string;
}) {
  return (
    <Card className="border-border/60">
      <CardContent className="p-4">
        <div className="flex items-center justify-between gap-3">
          <div>
            <p className="text-muted-foreground text-[10px] font-black uppercase tracking-widest">{title}</p>
            <p className="font-black text-2xl text-foreground mt-0.5">{value}</p>
          </div>
          <div className={`rounded-xl bg-muted/30 p-2.5 ${color ?? "text-primary"}`}>
            {icon ?? <Zap className="h-4 w-4" />}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
