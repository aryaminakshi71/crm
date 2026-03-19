import { Card, CardContent, CardHeader, CardTitle, Badge, Button, Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@crm/ui";
import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowLeft, AppWindow, CheckCircle, XCircle, Plus, RefreshCw } from "lucide-react";

export const Route = createFileRoute("/app/monitoring/catalog")({
  component: CatalogPage,
});

function CatalogPage() {
  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Link to="/app/monitoring">
          <Card className="p-1.5 border-border/60">
            <ArrowLeft className="h-4 w-4" />
          </Card>
        </Link>
        <div>
          <h2 className="font-bold text-xl text-foreground">App Catalog</h2>
          <p className="text-muted-foreground text-sm">Registered applications and services.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
        <Card className="border-border/60">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-muted-foreground text-[10px] font-black uppercase tracking-widest">Total Apps</p>
                <p className="font-black text-2xl text-foreground mt-0.5">0</p>
              </div>
              <AppWindow className="h-8 w-8 text-blue-600" />
            </div>
          </CardContent>
        </Card>
        <Card className="border-border/60">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-muted-foreground text-[10px] font-black uppercase tracking-widest">Active</p>
                <p className="font-black text-2xl text-foreground mt-0.5">0</p>
              </div>
              <CheckCircle className="h-8 w-8 text-green-600" />
            </div>
          </CardContent>
        </Card>
        <Card className="border-border/60">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-muted-foreground text-[10px] font-black uppercase tracking-widest">Inactive</p>
                <p className="font-black text-2xl text-foreground mt-0.5">0</p>
              </div>
              <XCircle className="h-8 w-8 text-red-600" />
            </div>
          </CardContent>
        </Card>
      </div>

      <Card className="border-border/60">
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>Registered Applications</CardTitle>
          <div className="flex gap-2">
            <Button variant="outline" size="sm"><RefreshCw className="h-4 w-4 mr-1" /> Refresh</Button>
            <Button variant="primary" size="sm"><Plus className="h-4 w-4 mr-1" /> Register App</Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="text-center py-12 text-muted-foreground">
            <AppWindow className="h-12 w-12 mx-auto mb-3 opacity-50" />
            <p>No apps registered yet.</p>
            <p className="text-sm mt-1">Register your first application to start monitoring.</p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
