import {
  Badge,
  Button,
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@crm/ui";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";
import {
  Activity,
  Cpu,
  Layers,
  Package,
  ShieldCheck,
  Sparkles,
  TrendingUp,
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
import { modulesApi } from "../lib/api";

export const Route = createFileRoute("/app/marketplace")({
  component: ModulesPage,
});

type ModuleStatus = {
  key: string;
  name: string;
  description: string;
  phase: "core" | "ops" | "growth" | "ai";
  enabled: boolean;
  limits: Record<string, unknown> | null;
  updatedAt: string | null;
};

function phaseBadgeClass(phase: ModuleStatus["phase"]) {
  if (phase === "core") return "bg-primary/10 text-primary";
  if (phase === "ops") return "bg-blue-500/10 text-blue-600";
  if (phase === "growth") return "bg-emerald-500/10 text-emerald-600";
  return "bg-violet-500/10 text-violet-600";
}

function ModulesPage() {
  const queryClient = useQueryClient();

  const { data, isLoading, error } = useQuery({
    queryKey: ["nucleo-modules"],
    queryFn: () => modulesApi.list(),
  });

  const toggleMutation = useMutation({
    mutationFn: ({ key, enabled }: { key: string; enabled: boolean }) =>
      modulesApi.setEnabled(key, enabled),
    onSuccess: (_result, variables) => {
      queryClient.invalidateQueries({ queryKey: ["nucleo-modules"] });
      toast.success(
        `${variables.enabled ? "Enabled" : "Disabled"} ${variables.key}`,
      );
    },
    onError: (err: Error) => {
      toast.error(err.message || "Module update failed.");
    },
  });

  const modules = (data?.modules || []) as ModuleStatus[];
  const enabledCount = modules.filter((m) => m.enabled).length;

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 gap-4 md:grid-cols-4">
        <Metric
          title="Active Modules"
          value={`${enabledCount}/${modules.length}`}
          icon={<Layers className="h-4 w-4" />}
          trend="Core enabled"
          color="text-primary"
        />
        <Metric
          title="AI Readiness"
          value="Level 4"
          icon={<Sparkles className="h-4 w-4" />}
          trend="High optimization"
          color="text-violet-400"
        />
        <Metric
          title="System Load"
          value="24%"
          icon={<Activity className="h-4 w-4" />}
          trend="Stable"
          color="text-emerald-400"
        />
        <Metric
          title="API Health"
          value="99.9%"
          icon={<ShieldCheck className="h-4 w-4" />}
          trend="Nominal"
          color="text-cyan-400"
        />
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <div>
              <CardTitle className="text-sm font-bold uppercase tracking-tight text-muted-foreground">
                Ecosystem Growth
              </CardTitle>
              <p className="text-2xl font-black text-foreground">
                Module Adoption
              </p>
            </div>
            <TrendingUp className="h-4 w-4 text-muted-foreground/40" />
          </CardHeader>
          <CardContent>
            <div className="h-[250px] w-full mt-4">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart
                  data={[
                    { month: "Jan", enabled: 4, usage: 120 },
                    { month: "Feb", enabled: 6, usage: 180 },
                    { month: "Mar", enabled: 8, usage: 250 },
                    { month: "Apr", enabled: 9, usage: 320 },
                    { month: "May", enabled: 11, usage: 410 },
                  ]}
                >
                  <defs>
                    <linearGradient
                      id="colorModules"
                      x1="0"
                      y1="0"
                      x2="0"
                      y2="1"
                    >
                      <stop offset="5%" stopColor="#8b5cf6" stopOpacity={0.2} />
                      <stop offset="95%" stopColor="#8b5cf6" stopOpacity={0} />
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
                    dataKey="usage"
                    stroke="#8b5cf6"
                    fillOpacity={1}
                    fill="url(#colorModules)"
                    strokeWidth={2}
                  />
                  <Area
                    type="monotone"
                    dataKey="enabled"
                    stroke="#38bdf8"
                    fillOpacity={0}
                    strokeWidth={1.5}
                    strokeDasharray="4 4"
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <Cpu className="h-4 w-4 text-primary" />
              <CardTitle className="text-sm font-bold">Optimization</CardTitle>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="rounded-xl border border-primary/20 bg-primary/5 p-4 text-center">
              <p className="text-[11px] font-black uppercase tracking-widest text-primary mb-1">
                Recommended
              </p>
              <p className="text-xs font-bold text-foreground mb-4">
                Advance Projects AI Beta
              </p>
              <p className="text-[10px] text-muted-foreground leading-relaxed">
                Enabling the AI beta for Projects can reduce task planning time
                by up to **35%** based on your current workload.
              </p>
              <Button
                size="sm"
                variant="primary"
                className="mt-4 w-full h-8 text-[10px] uppercase font-black tracking-widest leading-none"
              >
                Preview Beta
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>

      {error ? (
        <Card>
          <CardContent className="p-6">
            <p className="text-destructive">
              {(error as Error).message || "Failed to load module status."}
            </p>
          </CardContent>
        </Card>
      ) : null}

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        {isLoading
          ? [1, 2, 3, 4].map((i) => (
              <Card key={i}>
                <CardContent className="p-6">
                  <div className="h-24 animate-pulse rounded bg-muted" />
                </CardContent>
              </Card>
            ))
          : modules.map((moduleStatus) => {
              const busy =
                toggleMutation.isPending &&
                toggleMutation.variables?.key === moduleStatus.key;

              return (
                <Card key={moduleStatus.key}>
                  <CardHeader>
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex items-center gap-2">
                        <div className="rounded-md bg-primary/10 p-2">
                          {moduleStatus.phase === "ai" ? (
                            <Sparkles className="h-4 w-4 text-primary" />
                          ) : (
                            <Layers className="h-4 w-4 text-primary" />
                          )}
                        </div>
                        <div>
                          <CardTitle className="text-base">
                            {moduleStatus.name}
                          </CardTitle>
                          <p className="text-muted-foreground text-xs">
                            key:{" "}
                            {moduleStatus.key === "crm"
                              ? "core"
                              : moduleStatus.key}
                          </p>
                        </div>
                      </div>
                      <Badge className={phaseBadgeClass(moduleStatus.phase)}>
                        {moduleStatus.phase}
                      </Badge>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <p className="min-h-[36px] text-muted-foreground text-sm">
                      {moduleStatus.description}
                    </p>
                    <div className="flex items-center justify-between">
                      <Badge
                        variant={moduleStatus.enabled ? "success" : "outline"}
                      >
                        {moduleStatus.enabled ? "Enabled" : "Disabled"}
                      </Badge>
                      <Button
                        variant={moduleStatus.enabled ? "outline" : "primary"}
                        disabled={busy || moduleStatus.key === "crm"}
                        onClick={() =>
                          toggleMutation.mutate({
                            key: moduleStatus.key,
                            enabled: !moduleStatus.enabled,
                          })
                        }
                      >
                        {busy
                          ? "Saving..."
                          : moduleStatus.key === "crm"
                            ? "Core"
                            : moduleStatus.enabled
                              ? "Disable"
                              : "Enable"}
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
      </div>
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
            {icon || <Package className="h-4 w-4" />}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
