import { Card, CardContent, CardHeader, CardTitle, Badge, Table, TableBody, TableCell, TableHead, TableHeader, TableRow, Button } from "@crm/ui";
import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowLeft, LifeBuoy, Clock, CheckCircle, AlertCircle, Plus } from "lucide-react";

export const Route = createFileRoute("/app/monitoring/support")({
  component: SupportPage,
});

function SupportPage() {
  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Link to="/app/monitoring">
          <Card className="p-1.5 border-border/60">
            <ArrowLeft className="h-4 w-4" />
          </Card>
        </Link>
        <div>
          <h2 className="font-bold text-xl text-foreground">Support</h2>
          <p className="text-muted-foreground text-sm">Support ticket monitoring.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-4">
        <Card className="border-border/60">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-muted-foreground text-[10px] font-black uppercase tracking-widest">Open Tickets</p>
                <p className="font-black text-2xl text-foreground mt-0.5">0</p>
              </div>
              <LifeBuoy className="h-8 w-8 text-blue-600" />
            </div>
          </CardContent>
        </Card>
        <Card className="border-border/60">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-muted-foreground text-[10px] font-black uppercase tracking-widest">Avg Response</p>
                <p className="font-black text-2xl text-foreground mt-0.5">0h</p>
              </div>
              <Clock className="h-8 w-8 text-purple-600" />
            </div>
          </CardContent>
        </Card>
        <Card className="border-border/60">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-muted-foreground text-[10px] font-black uppercase tracking-widest">SLA Compliance</p>
                <p className="font-black text-2xl text-foreground mt-0.5">100%</p>
              </div>
              <CheckCircle className="h-8 w-8 text-green-600" />
            </div>
          </CardContent>
        </Card>
        <Card className="border-border/60">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-muted-foreground text-[10px] font-black uppercase tracking-widest">Resolved Today</p>
                <p className="font-black text-2xl text-foreground mt-0.5">0</p>
              </div>
              <AlertCircle className="h-8 w-8 text-orange-600" />
            </div>
          </CardContent>
        </Card>
      </div>

      <Card className="border-border/60">
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>Recent Tickets</CardTitle>
          <Button variant="primary" size="sm"><Plus className="h-4 w-4 mr-1" /> New Ticket</Button>
        </CardHeader>
        <CardContent>
          <div className="text-center py-12 text-muted-foreground">
            <LifeBuoy className="h-12 w-12 mx-auto mb-3 opacity-50" />
            <p>No support tickets yet.</p>
            <p className="text-sm mt-1">Tickets from your helpdesk will appear here.</p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
