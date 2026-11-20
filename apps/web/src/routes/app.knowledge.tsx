import {
  Button,
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  EmptyState,
  Loading,
} from "@crm/ui";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";
import {
  Activity,
  BookOpen,
  Eye,
  FileText,
  Plus,
  ShieldCheck,
  TrendingUp,
  Users,
  Zap,
} from "lucide-react";
import {
  Area,
  AreaChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { toast } from "sonner";
import { nucleoApi } from "@/lib/api";

export const Route = createFileRoute("/app/knowledge")({
  component: KnowledgePage,
});

function KnowledgePage() {
  const queryClient = useQueryClient();

  const { data, isLoading } = useQuery({
    queryKey: ["nucleo-documents"],
    queryFn: () => nucleoApi.documents.list({ page: 1, limit: 50 }),
  });

  const createDocument = useMutation({
    mutationFn: ({ title, content }: { title: string; content?: string }) =>
      nucleoApi.documents.create({ title, content }),
    onSuccess: () => {
      toast.success("Document created");
      queryClient.invalidateQueries({ queryKey: ["nucleo-documents"] });
      queryClient.invalidateQueries({ queryKey: ["nucleo-summary"] });
    },
    onError: (err: Error) =>
      toast.error(err.message || "Failed to create document"),
  });

  const docs = data?.data || [];

  const onCreate = () => {
    const title = window.prompt("Document title");
    if (!title || !title.trim()) return;
    const content = window.prompt("Initial content (optional)") || "";
    createDocument.mutate({ title: title.trim(), content });
  };

  if (isLoading) return <Loading text="Loading documents..." />;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-bold text-2xl text-foreground">Knowledge</h1>
          <p className="text-muted-foreground">
            Shared document intelligence in one workspace.
          </p>
        </div>
        <Button
          variant="primary"
          leftIcon={<Plus className="h-4 w-4" />}
          onClick={onCreate}
          loading={createDocument.isPending}
        >
          New Document
        </Button>
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-4">
        <Metric
          title="Total Documents"
          value={docs.length}
          icon={<FileText className="h-4 w-4" />}
          trend="+4 this week"
          color="text-primary"
        />
        <Metric
          title="Shared Intelligence"
          value="24"
          icon={<Users className="h-4 w-4" />}
          trend="Across teams"
          color="text-cyan-400"
        />
        <Metric
          title="Read Volume"
          value="1.2k"
          icon={<Eye className="h-4 w-4" />}
          trend="+15% monthly"
          color="text-rose-400"
        />
        <Metric
          title="Wiki Integrity"
          value="99%"
          icon={<ShieldCheck className="h-4 w-4" />}
          trend="Verified docs"
          color="text-emerald-400"
        />
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <div>
              <CardTitle className="text-sm font-bold uppercase tracking-tight text-muted-foreground">
                Knowledge Base Velocity
              </CardTitle>
              <p className="text-2xl font-black text-foreground">
                Content Growth
              </p>
            </div>
            <TrendingUp className="h-4 w-4 text-muted-foreground/40" />
          </CardHeader>
          <CardContent>
            <div className="h-[250px] w-full mt-4">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart
                  data={[
                    { month: "Jan", docs: 45, updates: 120 },
                    { month: "Feb", docs: 52, updates: 155 },
                    { month: "Mar", docs: 58, updates: 130 },
                    { month: "Apr", docs: 65, updates: 180 },
                    { month: "May", docs: 72, updates: 210 },
                  ]}
                >
                  <defs>
                    <linearGradient
                      id="colorKnowledge"
                      x1="0"
                      y1="0"
                      x2="0"
                      y2="1"
                    >
                      <stop offset="5%" stopColor="#22d3ee" stopOpacity={0.2} />
                      <stop offset="95%" stopColor="#22d3ee" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid
                    strokeDasharray="3 3"
                    vertical={false}
                    stroke="rgba(255,255,255,0.05)"
                  />
                  <XAxis
                    dataKey="month"
                    axisLine={false}
                    tickLine={false}
                    fontSize={10}
                    stroke="#888"
                  />
                  <YAxis
                    axisLine={false}
                    tickLine={false}
                    fontSize={10}
                    stroke="#888"
                  />
                  <Tooltip
                    contentStyle={{
                      background: "#0f172a",
                      border: "none",
                      borderRadius: "12px",
                      fontSize: "11px",
                    }}
                  />
                  <Area
                    type="monotone"
                    dataKey="updates"
                    stroke="#22d3ee"
                    fillOpacity={1}
                    fill="url(#colorKnowledge)"
                    strokeWidth={2}
                  />
                  <Area
                    type="monotone"
                    dataKey="docs"
                    stroke="#818cf8"
                    fillOpacity={0}
                    strokeWidth={1}
                    strokeDasharray="5 5"
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <Activity className="h-4 w-4 text-primary" />
              <CardTitle className="text-sm font-bold">
                Smart Indexing
              </CardTitle>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="rounded-xl border border-primary/20 bg-primary/5 p-4">
              <p className="text-[11px] font-medium text-muted-foreground leading-relaxed">
                AI is currently indexing **3 new documents** for internal
                semantic search. Retrieval speed at 120ms.
              </p>
            </div>
            <div className="pt-2">
              <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground mb-3">
                Popular This Week
              </p>
              <div className="space-y-3">
                {[
                  { title: "Onboarding SDK", views: 245 },
                  { title: "Ops Retention Policy", views: 182 },
                  { title: "Q3 Sales Strategy", views: 120 },
                ].map((doc, i) => (
                  <div
                    key={i}
                    className="flex items-center justify-between text-[11px]"
                  >
                    <span className="font-bold text-foreground">
                      {doc.title}
                    </span>
                    <span className="text-muted-foreground">
                      {doc.views} views
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {docs.length === 0 ? (
        <EmptyState
          icon={<BookOpen className="h-12 w-12" />}
          title="No documents yet"
          description="Create your first knowledge document in Nucleo One."
          action={<Button onClick={onCreate}>Create Document</Button>}
        />
      ) : (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
          {docs.map((doc: any) => (
            <Card key={doc.id}>
              <CardHeader>
                <CardTitle className="text-base">{doc.title}</CardTitle>
              </CardHeader>
              <CardContent className="space-y-1 text-sm">
                <p className="text-muted-foreground">Status: {doc.status}</p>
                <p className="text-muted-foreground">
                  Version: {doc.currentVersion}
                </p>
                <p className="text-muted-foreground">
                  Updated: {new Date(doc.updatedAt).toLocaleDateString()}
                </p>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
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
            <p className="text-muted-foreground text-[10px] font-black uppercase tracking-widest">
              {title}
            </p>
            <p className="font-black text-2xl text-foreground mt-0.5">
              {value}
            </p>
            {trend && (
              <div className="mt-2 flex items-center gap-1.5">
                <Zap className="h-2.5 w-2.5 text-primary/40" />
                <span className="text-[9px] font-bold text-muted-foreground/60">
                  {trend}
                </span>
              </div>
            )}
          </div>
          <div
            className={`rounded-xl bg-muted/30 p-2.5 ${color || "text-primary"}`}
          >
            {icon || <BookOpen className="h-4 w-4" />}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
