import {
  Badge,
  Button,
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@crm/ui";
import { createFileRoute } from "@tanstack/react-router";
import {
  Database,
  Globe,
  HardDrive,
  Link2,
  Mail,
  RefreshCw,
  Server,
  Settings,
  Shield,
  Table2,
  Users,
} from "lucide-react";
import { z } from "zod";

// ─── Route ─────────────────────────────────────────────────────────────────

export const Route = createFileRoute("/app/data-platform")({
  validateSearch: z.object({}),
  component: DataPlatformPage,
});

// ─── Metric Component ───────────────────────────────────────────────────────

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
              <p className="text-muted-foreground text-xs mt-1">{trend}</p>
            )}
          </div>
          <div
            className={`rounded-xl bg-muted/30 p-2.5 ${color || "text-primary"}`}
          >
            {icon || <Database className="h-4 w-4" />}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

// ─── Page Component ─────────────────────────────────────────────────────────

function DataPlatformPage() {
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="font-bold text-2xl text-foreground">
            Data Management Platform
          </h1>
          <p className="text-muted-foreground text-sm">
            Centralized data management, analytics pipelines, and integrations.
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" leftIcon={<RefreshCw className="h-4 w-4" />}>
            Sync Data
          </Button>
          <Button
            variant="primary"
            leftIcon={<Settings className="h-4 w-4" />}
          >
            Settings
          </Button>
        </div>
      </div>

      {/* Stats Row */}
      <div className="grid grid-cols-1 gap-4 md:grid-cols-4">
        <Metric
          title="Data Sources"
          value="24"
          icon={<Database className="h-4 w-4" />}
          trend="3 new this week"
          color="text-primary"
        />
        <Metric
          title="Total Records"
          value="4.2M"
          icon={<Table2 className="h-4 w-4" />}
          trend="+120K today"
          color="text-info"
        />
        <Metric
          title="Integrations"
          value="18"
          icon={<Link2 className="h-4 w-4" />}
          trend="All active"
          color="text-success"
        />
        <Metric
          title="Storage Used"
          value="1.8 TB"
          icon={<HardDrive className="h-4 w-4" />}
          trend="65% of limit"
          color="text-warning"
        />
      </div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* Data Sources */}
        <Card className="border-border/60 lg:col-span-2">
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="text-base">Connected Data Sources</CardTitle>
              <Button variant="ghost" size="sm">View All</Button>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="flex items-center justify-between p-3 rounded-lg bg-muted/30">
                <div className="flex items-center gap-3">
                  <div className="rounded-lg bg-primary/10 p-2">
                    <Users className="h-4 w-4 text-primary" />
                  </div>
                  <div>
                    <p className="text-sm font-medium">CRM Database</p>
                    <p className="text-xs text-muted-foreground">
                      PostgreSQL • 1.2M records
                    </p>
                  </div>
                </div>
                <Badge variant="success">Connected</Badge>
              </div>
              <div className="flex items-center justify-between p-3 rounded-lg bg-muted/30">
                <div className="flex items-center gap-3">
                  <div className="rounded-lg bg-primary/10 p-2">
                    <Globe className="h-4 w-4 text-primary" />
                  </div>
                  <div>
                    <p className="text-sm font-medium">Web Analytics</p>
                    <p className="text-xs text-muted-foreground">
                      Google Analytics • 2.8M events
                    </p>
                  </div>
                </div>
                <Badge variant="success">Connected</Badge>
              </div>
              <div className="flex items-center justify-between p-3 rounded-lg bg-muted/30">
                <div className="flex items-center gap-3">
                  <div className="rounded-lg bg-primary/10 p-2">
                    <Mail className="h-4 w-4 text-primary" />
                  </div>
                  <div>
                    <p className="text-sm font-medium">Email Platform</p>
                    <p className="text-xs text-muted-foreground">
                      SendGrid • 180K contacts
                    </p>
                  </div>
                </div>
                <Badge variant="success">Connected</Badge>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Quick Actions */}
        <Card className="border-border/60">
          <CardHeader>
            <CardTitle className="text-base">Quick Actions</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <Button variant="outline" className="w-full justify-start" leftIcon={<Database className="h-4 w-4" />}>
              Add Data Source
            </Button>
            <Button variant="outline" className="w-full justify-start" leftIcon={<Server className="h-4 w-4" />}>
              Create Pipeline
            </Button>
            <Button variant="outline" className="w-full justify-start" leftIcon={<Link2 className="h-4 w-4" />}>
              Manage Integrations
            </Button>
            <Button variant="outline" className="w-full justify-start" leftIcon={<Shield className="h-4 w-4" />}>
              Data Governance
            </Button>
          </CardContent>
        </Card>
      </div>

      {/* Recent Pipelines */}
      <Card className="border-border/60">
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="text-base">Recent Analytics Pipelines</CardTitle>
            <Button variant="ghost" size="sm">View All</Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            <div className="flex items-center justify-between p-3 rounded-lg bg-muted/30">
              <div className="flex items-center gap-3">
                <RefreshCw className="h-4 w-4 text-muted-foreground" />
                <div>
                  <p className="text-sm font-medium">Customer Events ETL</p>
                  <p className="text-xs text-muted-foreground">
                    Last run: 2 hours ago • 15M rows processed
                  </p>
                </div>
              </div>
              <Badge variant="success">Active</Badge>
            </div>
            <div className="flex items-center justify-between p-3 rounded-lg bg-muted/30">
              <div className="flex items-center gap-3">
                <RefreshCw className="h-4 w-4 text-muted-foreground" />
                <div>
                  <p className="text-sm font-medium">Revenue Aggregation</p>
                  <p className="text-xs text-muted-foreground">
                    Last run: 1 day ago • 2.4M rows processed
                  </p>
                </div>
              </div>
              <Badge variant="outline">Idle</Badge>
            </div>
            <div className="flex items-center justify-between p-3 rounded-lg bg-muted/30">
              <div className="flex items-center gap-3">
                <RefreshCw className="h-4 w-4 text-muted-foreground" />
                <div>
                  <p className="text-sm font-medium">Marketing Attribution</p>
                  <p className="text-xs text-muted-foreground">
                    Last run: 3 days ago • 8.1M rows processed
                  </p>
                </div>
              </div>
              <Badge variant="outline">Idle</Badge>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
