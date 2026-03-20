/**
 * A/B Testing Configuration
 *
 * Configure and monitor A/B tests for campaigns.
 */

import {
  Badge,
  Button,
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@crm/ui";
import { createFileRoute, Link } from "@tanstack/react-router";
import {
  ArrowLeft,
  BarChart3,
  Beaker,
  CheckCircle,
  FlaskConical,
  Plus,
  RefreshCw,
  Star,
  Target,
  TrendingUp,
  Trophy,
  Zap,
} from "lucide-react";
import { useState } from "react";
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

export const Route = createFileRoute("/app/marketing/ab-testing")({
  component: ABTesting,
});

const mockTests = [
  {
    id: "1",
    name: "Subject Line Test - Spring Sale",
    status: "running",
    campaign: "Spring Sale 2026",
    startedAt: "2026-03-15",
    endsAt: "2026-03-22",
    variants: [
      { id: "A", name: "Flash Sale! Up to 50% Off", sent: 5000, opened: 1850, clicked: 320, converted: 45, openRate: 37.0, clickRate: 6.4, conversionRate: 0.9 },
      { id: "B", name: "Spring Sale: Don't Miss Out", sent: 5000, opened: 1620, clicked: 280, converted: 38, openRate: 32.4, clickRate: 5.6, conversionRate: 0.76 },
      { id: "C", name: "Your Exclusive Spring Offer Awaits", sent: 5000, opened: 1580, clicked: 245, converted: 32, openRate: 31.6, clickRate: 4.9, conversionRate: 0.64 },
    ],
  },
  {
    id: "2",
    name: "CTA Button Color Test",
    status: "completed",
    campaign: "Product Launch - Series X",
    startedAt: "2026-02-20",
    endedAt: "2026-02-27",
    winner: "A",
    variants: [
      { id: "A", name: "Green Button", sent: 3000, opened: 1200, clicked: 280, converted: 42, openRate: 40.0, clickRate: 9.3, conversionRate: 1.4 },
      { id: "B", name: "Blue Button", sent: 3000, opened: 1180, clicked: 245, converted: 35, openRate: 39.3, clickRate: 8.2, conversionRate: 1.17 },
    ],
  },
  {
    id: "3",
    name: "Send Time Optimization",
    status: "draft",
    campaign: "Weekly Newsletter",
    startedAt: null,
    endsAt: null,
    variants: [
      { id: "A", name: "9:00 AM Tuesday", sent: 0, opened: 0, clicked: 0, converted: 0, openRate: 0, clickRate: 0, conversionRate: 0 },
      { id: "B", name: "2:00 PM Tuesday", sent: 0, opened: 0, clicked: 0, converted: 0, openRate: 0, clickRate: 0, conversionRate: 0 },
      { id: "C", name: "10:00 AM Wednesday", sent: 0, opened: 0, clicked: 0, converted: 0, openRate: 0, clickRate: 0, conversionRate: 0 },
    ],
  },
];

function ABTesting() {
  const [activeTest, setActiveTest] = useState<string | null>("1");

  const getStatusBadge = (status: string) => {
    const variants: Record<string, "success" | "warning" | "outline" | "primary"> = {
      running: "success",
      completed: "primary",
      draft: "outline",
    };
    return <Badge variant={variants[status]}>{status}</Badge>;
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="flex items-center gap-4">
          <Link to="/app/marketing">
            <Button variant="ghost" size="sm" leftIcon={<ArrowLeft className="h-4 w-4" />}>
              Back
            </Button>
          </Link>
          <div>
            <h2 className="font-bold text-xl text-foreground">A/B Testing</h2>
            <p className="text-sm text-muted-foreground">Optimize campaigns with controlled experiments</p>
          </div>
        </div>
        <Button variant="primary" size="sm" leftIcon={<Plus className="h-4 w-4" />}>
          New A/B Test
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
        <StatCard title="Active Tests" value="2" icon={<Beaker className="h-4 w-4" />} color="text-primary" />
        <StatCard title="Completed" value="12" icon={<CheckCircle className="h-4 w-4" />} color="text-emerald-400" />
        <StatCard title="Avg Lift" value="+18%" icon={<TrendingUp className="h-4 w-4" />} color="text-violet-400" />
        <StatCard title="Winner Rate" value="67%" icon={<Trophy className="h-4 w-4" />} color="text-amber-400" />
      </div>

      {/* Test List */}
      <div className="space-y-4">
        {mockTests.map((test) => (
          <Card
            key={test.id}
            className={`cursor-pointer transition-colors ${activeTest === test.id ? "border-primary" : "hover:border-primary/50"}`}
            onClick={() => setActiveTest(test.id)}
          >
            <CardContent className="p-4">
              <div className="flex flex-wrap items-start justify-between gap-4">
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="font-semibold">{test.name}</h3>
                    {getStatusBadge(test.status)}
                  </div>
                  <p className="mt-1 text-xs text-muted-foreground">
                    Campaign: {test.campaign}
                    {test.startedAt && ` • Started ${new Date(test.startedAt).toLocaleDateString()}`}
                    {test.endsAt && ` • Ends ${new Date(test.endsAt).toLocaleDateString()}`}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  {test.winner && (
                    <Badge variant="success" className="gap-1">
                      <Trophy className="h-3 w-3" />
                      Winner: {test.winner}
                    </Badge>
                  )}
                  <Button variant="ghost" size="sm" leftIcon={<BarChart3 className="h-4 w-4" />}>
                    Details
                  </Button>
                </div>
              </div>

              {/* Variant Comparison */}
              <div className="mt-4 grid grid-cols-1 gap-3 md:grid-cols-3">
                {test.variants.map((variant, index) => (
                  <div
                    key={variant.id}
                    className={`rounded-lg border p-3 ${
                      test.winner === variant.id
                        ? "border-emerald-500 bg-emerald-500/5"
                        : test.status === "running" && index === 0
                        ? "border-primary bg-primary/5"
                        : "border-border"
                    }`}
                  >
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <span className="flex h-6 w-6 items-center justify-center rounded-full bg-muted text-xs font-bold">
                          {variant.id}
                        </span>
                        <span className="text-sm font-medium">{variant.name}</span>
                      </div>
                      {test.winner === variant.id && <Trophy className="h-4 w-4 text-emerald-500" />}
                    </div>
                    <div className="grid grid-cols-3 gap-2 text-center text-xs">
                      <div>
                        <p className="font-semibold">{variant.openRate}%</p>
                        <p className="text-muted-foreground">Open</p>
                      </div>
                      <div>
                        <p className="font-semibold">{variant.clickRate}%</p>
                        <p className="text-muted-foreground">Click</p>
                      </div>
                      <div>
                        <p className="font-semibold">{variant.conversionRate}%</p>
                        <p className="text-muted-foreground">Conv.</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {/* Progress bar for running tests */}
              {test.status === "running" && (
                <div className="mt-4">
                  <div className="flex items-center justify-between text-xs text-muted-foreground mb-1">
                    <span>Test Progress</span>
                    <span>Day 3 of 7</span>
                  </div>
                  <div className="h-2 w-full rounded-full bg-muted">
                    <div className="h-2 rounded-full bg-primary" style={{ width: "43%" }} />
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Test Configuration */}
      <Card>
        <CardHeader>
          <CardTitle className="text-sm font-bold uppercase tracking-tight text-muted-foreground">
            Create New A/B Test
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4">
            <div>
              <label className="mb-1 block text-xs font-medium text-muted-foreground">Test Name</label>
              <input
                type="text"
                placeholder="e.g., Subject Line Test"
                className="flex h-10 w-full rounded-lg border border-border bg-card px-3 py-2 text-sm"
              />
            </div>
            <div>
              <label className="mb-1 block text-xs font-medium text-muted-foreground">Campaign</label>
              <select className="flex h-10 w-full rounded-lg border border-border bg-card px-3 py-2 text-sm">
                <option>Select campaign</option>
                <option>Spring Sale 2026</option>
                <option>Product Launch - Series X</option>
                <option>Weekly Newsletter</option>
              </select>
            </div>
            <div>
              <label className="mb-1 block text-xs font-medium text-muted-foreground">Test Type</label>
              <select className="flex h-10 w-full rounded-lg border border-border bg-card px-3 py-2 text-sm">
                <option>Subject Line</option>
                <option>Content</option>
                <option>Send Time</option>
                <option>CTA Button</option>
              </select>
            </div>
            <div>
              <label className="mb-1 block text-xs font-medium text-muted-foreground">Test Duration</label>
              <select className="flex h-10 w-full rounded-lg border border-border bg-card px-3 py-2 text-sm">
                <option>3 days</option>
                <option>7 days</option>
                <option>14 days</option>
              </select>
            </div>
          </div>
          <div className="mt-4 flex justify-end">
            <Button variant="primary" size="sm" leftIcon={<FlaskConical className="h-4 w-4" />}>
              Create Test
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

function StatCard({ title, value, icon, color }: { title: string; value: string; icon: React.ReactNode; color: string }) {
  return (
    <Card className="border-border/60">
      <CardContent className="p-4">
        <div className="flex items-center justify-between gap-3">
          <div>
            <p className="text-muted-foreground text-[10px] font-black uppercase tracking-widest">{title}</p>
            <p className="font-black text-xl text-foreground mt-0.5">{value}</p>
          </div>
          <div className={`rounded-xl bg-muted/30 p-2 ${color}`}>{icon}</div>
        </div>
      </CardContent>
    </Card>
  );
}
