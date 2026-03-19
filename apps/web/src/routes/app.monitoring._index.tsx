import { Card, CardContent } from "@crm/ui";
import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import {
  Activity,
  AlertCircle,
  ArrowRight,
  BarChart3,
  CheckCircle,
  Clock,
  TrendingUp,
  Database,
  Shield,
  Zap,
} from "lucide-react";

export const Route = createFileRoute("/app/monitoring/_index")({
  component: MonitoringDashboard,
});

function MonitoringDashboard() {
  return (
    <div className="space-y-6">
      {/* Stats Row */}
      <div className="grid grid-cols-1 gap-4 md:grid-cols-4">
        <Card className="border-border/60">
          <CardContent className="p-4">
            <div className="flex items-center justify-between gap-3">
              <div>
                <p className="text-muted-foreground text-[10px] font-black uppercase tracking-widest">
                  Active Users
                </p>
                <p className="font-black text-2xl text-foreground mt-0.5">0</p>
                <p className="text-muted-foreground text-xs mt-1">+0% from last week</p>
              </div>
              <div className="rounded-xl bg-muted/30 p-2.5 text-primary">
                <Activity className="h-4 w-4" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-border/60">
          <CardContent className="p-4">
            <div className="flex items-center justify-between gap-3">
              <div>
                <p className="text-muted-foreground text-[10px] font-black uppercase tracking-widest">
                  Uptime
                </p>
                <p className="font-black text-2xl text-foreground mt-0.5">99.9%</p>
                <p className="text-green-600 text-xs mt-1">Last 30 days</p>
              </div>
              <div className="rounded-xl bg-muted/30 p-2.5 text-green-600">
                <CheckCircle className="h-4 w-4" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-border/60">
          <CardContent className="p-4">
            <div className="flex items-center justify-between gap-3">
              <div>
                <p className="text-muted-foreground text-[10px] font-black uppercase tracking-widest">
                  Errors (24h)
                </p>
                <p className="font-black text-2xl text-foreground mt-0.5">0</p>
                <p className="text-green-600 text-xs mt-1">-100% from yesterday</p>
              </div>
              <div className="rounded-xl bg-muted/30 p-2.5 text-green-600">
                <AlertCircle className="h-4 w-4" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-border/60">
          <CardContent className="p-4">
            <div className="flex items-center justify-between gap-3">
              <div>
                <p className="text-muted-foreground text-[10px] font-black uppercase tracking-widest">
                  Avg Response
                </p>
                <p className="font-black text-2xl text-foreground mt-0.5">0ms</p>
                <p className="text-muted-foreground text-xs mt-1">P95 latency</p>
              </div>
              <div className="rounded-xl bg-muted/30 p-2.5 text-primary">
                <Clock className="h-4 w-4" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Quick Links */}
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Link to="/app/monitoring/analytics">
          <Card className="border-border/60 hover:border-primary/50 transition-colors cursor-pointer h-full">
            <CardContent className="p-4 flex items-center gap-3">
              <BarChart3 className="h-5 w-5 text-primary" />
              <div>
                <p className="font-medium text-sm">Analytics</p>
                <p className="text-muted-foreground text-xs">User & behavior data</p>
              </div>
              <ArrowRight className="h-4 w-4 ml-auto text-muted-foreground" />
            </CardContent>
          </Card>
        </Link>

        <Link to="/app/monitoring/errors">
          <Card className="border-border/60 hover:border-primary/50 transition-colors cursor-pointer h-full">
            <CardContent className="p-4 flex items-center gap-3">
              <AlertCircle className="h-5 w-5 text-destructive" />
              <div>
                <p className="font-medium text-sm">Error Tracking</p>
                <p className="text-muted-foreground text-xs">Sentry integration</p>
              </div>
              <ArrowRight className="h-4 w-4 ml-auto text-muted-foreground" />
            </CardContent>
          </Card>
        </Link>

        <Link to="/app/monitoring/uptime">
          <Card className="border-border/60 hover:border-primary/50 transition-colors cursor-pointer h-full">
            <CardContent className="p-4 flex items-center gap-3">
              <CheckCircle className="h-5 w-5 text-green-600" />
              <div>
                <p className="font-medium text-sm">Uptime</p>
                <p className="text-muted-foreground text-xs">Service availability</p>
              </div>
              <ArrowRight className="h-4 w-4 ml-auto text-muted-foreground" />
            </CardContent>
          </Card>
        </Link>

        <Link to="/app/monitoring/performance">
          <Card className="border-border/60 hover:border-primary/50 transition-colors cursor-pointer h-full">
            <CardContent className="p-4 flex items-center gap-3">
              <TrendingUp className="h-5 w-5 text-primary" />
              <div>
                <p className="font-medium text-sm">Performance</p>
                <p className="text-muted-foreground text-xs">APM metrics</p>
              </div>
              <ArrowRight className="h-4 w-4 ml-auto text-muted-foreground" />
            </CardContent>
          </Card>
        </Link>
      </div>

      {/* Additional Links */}
      <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
        <Link to="/app/monitoring/support">
          <Card className="border-border/60 hover:border-primary/50 transition-colors cursor-pointer h-full">
            <CardContent className="p-4 flex items-center gap-3">
              <Activity className="h-5 w-5 text-blue-600" />
              <div>
                <p className="font-medium text-sm">Support</p>
                <p className="text-muted-foreground text-xs">Ticket monitoring</p>
              </div>
              <ArrowRight className="h-4 w-4 ml-auto text-muted-foreground" />
            </CardContent>
          </Card>
        </Link>

        <Link to="/app/monitoring/catalog">
          <Card className="border-border/60 hover:border-primary/50 transition-colors cursor-pointer h-full">
            <CardContent className="p-4 flex items-center gap-3">
              <Database className="h-5 w-5 text-purple-600" />
              <div>
                <p className="font-medium text-sm">App Catalog</p>
                <p className="text-muted-foreground text-xs">Registered applications</p>
              </div>
              <ArrowRight className="h-4 w-4 ml-auto text-muted-foreground" />
            </CardContent>
          </Card>
        </Link>

        <Link to="/app/monitoring">
          <Card className="border-border/60 hover:border-primary/50 transition-colors cursor-pointer h-full">
            <CardContent className="p-4 flex items-center gap-3">
              <Shield className="h-5 w-5 text-orange-600" />
              <div>
                <p className="font-medium text-sm">Security</p>
                <p className="text-muted-foreground text-xs">Security events</p>
              </div>
              <ArrowRight className="h-4 w-4 ml-auto text-muted-foreground" />
            </CardContent>
          </Card>
        </Link>
      </div>

      {/* System Status */}
      <Card className="border-border/60">
        <CardContent className="p-6">
          <div className="flex items-center gap-2 mb-4">
            <Zap className="h-5 w-5 text-primary" />
            <h3 className="font-bold">System Status</h3>
          </div>
          <div className="space-y-3">
            <div className="flex items-center justify-between py-2 border-b border-border/50">
              <span className="text-sm">API Services</span>
              <span className="flex items-center gap-2 text-sm text-green-600">
                <CheckCircle className="h-4 w-4" /> Operational
              </span>
            </div>
            <div className="flex items-center justify-between py-2 border-b border-border/50">
              <span className="text-sm">Database</span>
              <span className="flex items-center gap-2 text-sm text-green-600">
                <CheckCircle className="h-4 w-4" /> Operational
              </span>
            </div>
            <div className="flex items-center justify-between py-2 border-b border-border/50">
              <span className="text-sm">Authentication</span>
              <span className="flex items-center gap-2 text-sm text-green-600">
                <CheckCircle className="h-4 w-4" /> Operational
              </span>
            </div>
            <div className="flex items-center justify-between py-2">
              <span className="text-sm">File Storage</span>
              <span className="flex items-center gap-2 text-sm text-green-600">
                <CheckCircle className="h-4 w-4" /> Operational
              </span>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
