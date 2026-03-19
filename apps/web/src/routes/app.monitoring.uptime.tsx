import { Card, CardContent, CardHeader, CardTitle, Badge, Button } from "@crm/ui";
import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowLeft, CheckCircle, XCircle, Clock, RefreshCw, Plus } from "lucide-react";

export const Route = createFileRoute("/app/monitoring/uptime")({
  component: UptimePage,
});

const ENDPOINTS = [
  { id: "1", name: "API Gateway", url: "https://api.nucleo.one", status: "up", uptime: "99.99%", latency: "45ms" },
  { id: "2", name: "Web App", url: "https://app.nucleo.one", status: "up", uptime: "99.95%", latency: "120ms" },
  { id: "3", name: "Database", url: "postgres://db.nucleo.one", status: "up", uptime: "99.99%", latency: "5ms" },
];

function UptimePage() {
  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Link to="/app/monitoring">
          <Card className="p-1.5 border-border/60">
            <ArrowLeft className="h-4 w-4" />
          </Card>
        </Link>
        <div>
          <h2 className="font-bold text-xl text-foreground">Uptime Checks</h2>
          <p className="text-muted-foreground text-sm">Service availability monitoring.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-4">
        <Card className="border-border/60">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-muted-foreground text-[10px] font-black uppercase tracking-widest">Overall Uptime</p>
                <p className="font-black text-2xl text-foreground mt-0.5">99.98%</p>
              </div>
              <CheckCircle className="h-8 w-8 text-green-600" />
            </div>
          </CardContent>
        </Card>
        <Card className="border-border/60">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-muted-foreground text-[10px] font-black uppercase tracking-widest">Total Checks</p>
                <p className="font-black text-2xl text-foreground mt-0.5">{ENDPOINTS.length}</p>
              </div>
              <Clock className="h-8 w-8 text-blue-600" />
            </div>
          </CardContent>
        </Card>
        <Card className="border-border/60">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-muted-foreground text-[10px] font-black uppercase tracking-widest">Avg Latency</p>
                <p className="font-black text-2xl text-foreground mt-0.5">56ms</p>
              </div>
              <RefreshCw className="h-8 w-8 text-purple-600" />
            </div>
          </CardContent>
        </Card>
        <Card className="border-border/60">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-muted-foreground text-[10px] font-black uppercase tracking-widest">Incidents (30d)</p>
                <p className="font-black text-2xl text-foreground mt-0.5">0</p>
              </div>
              <XCircle className="h-8 w-8 text-destructive" />
            </div>
          </CardContent>
        </Card>
      </div>

      <Card className="border-border/60">
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>Monitored Endpoints</CardTitle>
          <Button variant="primary" size="sm"><Plus className="h-4 w-4 mr-1" /> Add Endpoint</Button>
        </CardHeader>
        <CardContent className="space-y-3">
          {ENDPOINTS.map((endpoint) => (
            <div key={endpoint.id} className="flex items-center justify-between p-3 border rounded-lg">
              <div className="flex items-center gap-3">
                {endpoint.status === "up" ? (
                  <CheckCircle className="h-5 w-5 text-green-600" />
                ) : (
                  <XCircle className="h-5 w-5 text-red-600" />
                )}
                <div>
                  <p className="font-medium text-sm">{endpoint.name}</p>
                  <p className="text-muted-foreground text-xs font-mono">{endpoint.url}</p>
                </div>
              </div>
              <div className="flex items-center gap-4">
                <div className="text-right">
                  <p className="text-sm font-medium">{endpoint.uptime}</p>
                  <p className="text-muted-foreground text-xs">uptime</p>
                </div>
                <div className="text-right">
                  <p className="text-sm font-medium">{endpoint.latency}</p>
                  <p className="text-muted-foreground text-xs">latency</p>
                </div>
                <Badge className={endpoint.status === "up" ? "bg-green-100 text-green-800" : "bg-red-100 text-red-800"}>
                  {endpoint.status}
                </Badge>
              </div>
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  );
}
