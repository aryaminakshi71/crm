import { Button, Card, CardContent, CardHeader, CardTitle, Badge, Input, Select } from "@crm/ui";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import {
  ArrowLeft,
  Phone,
  Plus,
  ArrowRight,
  Settings,
  Trash2,
  Users,
  Clock,
  MapPin,
} from "lucide-react";
import { useState } from "react";

export const Route = createFileRoute("/app/communications/routing")({
  component: CallRoutingPage,
});

interface RouteRule {
  id: string;
  name: string;
  conditions: string[];
  destination: string;
  priority: number;
  status: "active" | "paused";
}

const MOCK_ROUTES: RouteRule[] = [
  { id: "r1", name: "Business Hours", conditions: ["Time: 9AM-5PM", "Day: Mon-Fri"], destination: "Sales Team", priority: 1, status: "active" },
  { id: "r2", name: "After Hours", conditions: ["Time: 5PM-9AM", "Day: Mon-Fri"], destination: "Voicemail", priority: 2, status: "active" },
  { id: "r3", name: "Weekend", conditions: ["Day: Sat-Sun"], destination: "Emergency Line", priority: 3, status: "active" },
  { id: "r4", name: "VIP Customers", conditions: ["Caller ID: +1 555-123-4567"], destination: "VIP Support", priority: 1, status: "paused" },
];

function CallRoutingPage() {
  const navigate = useNavigate();

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => navigate({ to: "/app/communications" })}>
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div>
            <h2 className="font-bold text-xl">Call Routing</h2>
            <p className="text-muted-foreground text-sm">Configure how incoming calls are routed</p>
          </div>
        </div>
        <Button variant="primary" leftIcon={<Plus className="h-4 w-4" />}>
          Add Rule
        </Button>
      </div>

      {/* Stats */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card className="border-border/60">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-100">
                <Phone className="h-5 w-5 text-blue-600" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Active Rules</p>
                <p className="text-xl font-bold">{MOCK_ROUTES.filter((r) => r.status === "active").length}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="border-border/60">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-green-100">
                <Users className="h-5 w-5 text-green-600" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Calls Routed Today</p>
                <p className="text-xl font-bold">147</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="border-border/60">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-purple-100">
                <Clock className="h-5 w-5 text-purple-600" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Avg. Answer Time</p>
                <p className="text-xl font-bold">12s</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Routing Rules */}
      <Card className="border-border/60">
        <CardHeader>
          <CardTitle>Routing Rules</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {MOCK_ROUTES.map((rule, idx) => (
              <div key={rule.id} className="p-4 bg-muted/50 rounded-lg">
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center gap-3">
                    <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary text-primary-foreground text-sm font-bold">
                      {rule.priority}
                    </div>
                    <div>
                      <h3 className="font-semibold">{rule.name}</h3>
                      <Badge className={rule.status === "active" ? "bg-green-100 text-green-800" : "bg-gray-100 text-gray-800"}>
                        {rule.status}
                      </Badge>
                    </div>
                  </div>
                  <div className="flex gap-1">
                    <Button variant="ghost" size="icon" className="h-8 w-8">
                      <Settings className="h-4 w-4" />
                    </Button>
                    <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive">
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>

                <div className="flex items-center gap-2 mb-3 text-sm">
                  <span className="text-muted-foreground">When:</span>
                  {rule.conditions.map((cond, i) => (
                    <span key={i} className="px-2 py-0.5 bg-blue-50 text-blue-700 rounded">
                      {cond}
                    </span>
                  ))}
                </div>

                <div className="flex items-center gap-2 text-sm">
                  <span className="text-muted-foreground">Route to:</span>
                  <span className="px-2 py-0.5 bg-purple-50 text-purple-700 rounded">
                    {rule.destination}
                  </span>
                </div>

                {idx < MOCK_ROUTES.length - 1 && (
                  <div className="flex justify-center mt-4 mb-2">
                    <ArrowRight className="h-4 w-4 text-muted-foreground rotate-90" />
                  </div>
                )}
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
