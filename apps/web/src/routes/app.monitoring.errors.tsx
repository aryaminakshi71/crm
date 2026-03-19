import { Card, CardContent, CardHeader, CardTitle, Badge, Button, Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@crm/ui";
import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowLeft, AlertCircle, CheckCircle, Filter } from "lucide-react";

export const Route = createFileRoute("/app/monitoring/errors")({
  component: ErrorsPage,
});

const SAMPLE_ERRORS = [
  { id: "1", type: "TypeError", message: "Cannot read property 'foo' of undefined", count: 5, status: "resolved", time: "2h ago" },
  { id: "2", type: "ReferenceError", message: "variable is not defined", count: 3, status: "active", time: "4h ago" },
];

function ErrorsPage() {
  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Link to="/app/monitoring">
          <Card className="p-1.5 border-border/60">
            <ArrowLeft className="h-4 w-4" />
          </Card>
        </Link>
        <div>
          <h2 className="font-bold text-xl text-foreground">Error Tracking</h2>
          <p className="text-muted-foreground text-sm">Sentry error tracking integration.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
        <Card className="border-border/60">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-muted-foreground text-[10px] font-black uppercase tracking-widest">Total Errors</p>
                <p className="font-black text-2xl text-foreground mt-0.5">{SAMPLE_ERRORS.length}</p>
              </div>
              <AlertCircle className="h-8 w-8 text-destructive" />
            </div>
          </CardContent>
        </Card>
        <Card className="border-border/60">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-muted-foreground text-[10px] font-black uppercase tracking-widest">Active</p>
                <p className="font-black text-2xl text-foreground mt-0.5">{SAMPLE_ERRORS.filter(e => e.status === "active").length}</p>
              </div>
              <AlertCircle className="h-8 w-8 text-orange-500" />
            </div>
          </CardContent>
        </Card>
        <Card className="border-border/60">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-muted-foreground text-[10px] font-black uppercase tracking-widest">Resolved</p>
                <p className="font-black text-2xl text-foreground mt-0.5">{SAMPLE_ERRORS.filter(e => e.status === "resolved").length}</p>
              </div>
              <CheckCircle className="h-8 w-8 text-green-600" />
            </div>
          </CardContent>
        </Card>
      </div>

      <Card className="border-border/60">
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>Recent Errors</CardTitle>
          <Button variant="outline" size="sm"><Filter className="h-4 w-4 mr-1" /> Filter</Button>
        </CardHeader>
        <CardContent>
          {SAMPLE_ERRORS.length === 0 ? (
            <div className="text-center py-12">
              <AlertCircle className="h-12 w-12 mx-auto mb-3 text-muted-foreground opacity-50" />
              <p className="text-muted-foreground">No errors tracked yet.</p>
              <p className="text-sm text-muted-foreground mt-1">Connect Sentry to start tracking errors.</p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Type</TableHead>
                  <TableHead>Message</TableHead>
                  <TableHead>Count</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Time</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {SAMPLE_ERRORS.map((error) => (
                  <TableRow key={error.id}>
                    <TableCell className="font-mono text-sm">{error.type}</TableCell>
                    <TableCell className="max-w-md truncate">{error.message}</TableCell>
                    <TableCell>{error.count}</TableCell>
                    <TableCell>
                      <Badge className={error.status === "resolved" ? "bg-green-100 text-green-800" : "bg-red-100 text-red-800"}>
                        {error.status}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-muted-foreground text-sm">{error.time}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
