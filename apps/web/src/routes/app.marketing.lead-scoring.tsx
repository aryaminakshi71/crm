/**
 * Lead Scoring Rules
 *
 * Configure and manage lead scoring rules and tiers.
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
  Activity,
  ArrowLeft,
  ArrowUp,
  ArrowUpDown,
  BarChart3,
  Bell,
  CheckCircle,
  Edit,
  Flame,
  Flag,
  Minus,
  Plus,
  Target,
  ThumbsUp,
  ThumbsDown,
  TrendingUp,
  Users,
  Zap,
} from "lucide-react";
import { useState } from "react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

export const Route = createFileRoute("/app/marketing/lead-scoring")({
  component: LeadScoring,
});

const CHART_COLORS = ["#ef4444", "#f97316", "#eab308", "#22d3ee"];

const scoreDistribution = [
  { range: "Hot (80-100)", count: 234, color: "#ef4444" },
  { range: "Warm (50-79)", count: 892, color: "#f97316" },
  { range: "Cool (20-49)", count: 1456, color: "#eab308" },
  { range: "Cold (0-19)", count: 2103, color: "#22d3ee" },
];

const positiveRules = [
  { id: "1", name: "Visited pricing page", points: 15, category: "website", count: 1245 },
  { id: "2", name: "Opened email campaign", points: 5, category: "email", count: 3420 },
  { id: "3", name: "Clicked email link", points: 10, category: "email", count: 1890 },
  { id: "4", name: "Downloaded whitepaper", points: 20, category: "content", count: 567 },
  { id: "5", name: "Attended webinar", points: 25, category: "event", count: 234 },
  { id: "6", name: "Request demo", points: 30, category: "conversion", count: 123 },
  { id: "7", name: "Added to cart", points: 20, category: "ecommerce", count: 456 },
  { id: "8", name: "Followed on social", points: 5, category: "social", count: 890 },
];

const negativeRules = [
  { id: "1", name: "No email opens (30 days)", points: -5, category: "engagement", count: 1234 },
  { id: "2", name: "Unsubscribed from email", points: -20, category: "email", count: 89 },
  { id: "3", name: "Bounced email", points: -15, category: "email", count: 156 },
  { id: "4", name: "No website visit (60 days)", points: -10, category: "engagement", count: 567 },
];

const topScoredLeads = [
  { id: "1", name: "Sarah Chen", company: "Acme Corp", score: 95, tier: "hot", lastActivity: "Demo requested" },
  { id: "2", name: "Michael Roberts", company: "TechStart Inc", score: 88, tier: "hot", lastActivity: "Opened pricing email" },
  { id: "3", name: "Emily Watson", company: "Global Solutions", score: 82, tier: "hot", lastActivity: "Downloaded case study" },
  { id: "4", name: "David Kim", company: "Innovate Co", score: 76, tier: "warm", lastActivity: "Attended webinar" },
  { id: "5", name: "Jessica Brown", company: "Enterprise Ltd", score: 71, tier: "warm", lastActivity: "Visited pricing page" },
];

function LeadScoring() {
  const [activeTab, setActiveTab] = useState<"rules" | "tiers" | "leads">("rules");
  const [ruleType, setRuleType] = useState<"positive" | "negative">("positive");

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
            <h2 className="font-bold text-xl text-foreground">Lead Scoring</h2>
            <p className="text-sm text-muted-foreground">Configure rules to score and prioritize leads</p>
          </div>
        </div>
        <Button variant="primary" size="sm" leftIcon={<Plus className="h-4 w-4" />}>
          Add Rule
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
        <StatCard title="Total Leads" value="4,685" icon={<Users className="h-4 w-4" />} color="text-primary" />
        <StatCard title="Hot Leads" value="234" icon={<Flame className="h-4 w-4" />} color="text-rose-400" />
        <StatCard title="Avg Score" value="42" icon={<Target className="h-4 w-4" />} color="text-amber-400" />
        <StatCard title="Converted This Month" value="89" icon={<CheckCircle className="h-4 w-4" />} color="text-emerald-400" />
      </div>

      {/* Score Distribution Chart */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <Card className="lg:col-span-1">
          <CardHeader>
            <CardTitle className="text-sm font-bold uppercase tracking-tight text-muted-foreground">
              Score Distribution
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-[200px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={scoreDistribution}
                    cx="50%"
                    cy="50%"
                    innerRadius={50}
                    outerRadius={80}
                    paddingAngle={2}
                    dataKey="count"
                  >
                    {scoreDistribution.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip
                    contentStyle={{
                      background: "#0f172a",
                      border: "none",
                      borderRadius: "12px",
                      fontSize: "11px",
                    }}
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>
            <div className="mt-4 space-y-2">
              {scoreDistribution.map((item) => (
                <div key={item.range} className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="h-2 w-2 rounded-full" style={{ backgroundColor: item.color }} />
                    <span className="text-xs text-muted-foreground">{item.range}</span>
                  </div>
                  <span className="text-xs font-medium">{item.count}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Tier Configuration */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="text-sm font-bold uppercase tracking-tight text-muted-foreground">
              Tier Configuration
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <TierRow tier="hot" range="80-100" color="text-rose-400" bgColor="bg-rose-500/10" points="30-50" />
              <TierRow tier="warm" range="50-79" color="text-orange-400" bgColor="bg-orange-500/10" points="15-25" />
              <TierRow tier="cool" range="20-49" color="text-yellow-400" bgColor="bg-yellow-500/10" points="5-10" />
              <TierRow tier="cold" range="0-19" color="text-cyan-400" bgColor="bg-cyan-500/10" points="0-5" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Tabs */}
      <div className="border-b border-border">
        <nav className="flex gap-4">
          {[
            { id: "rules", label: "Scoring Rules", icon: Zap },
            { id: "tiers", label: "Tiers", icon: Flag },
            { id: "leads", label: "Top Leads", icon: Users },
          ].map((tab) => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as typeof activeTab)}
                className={`flex items-center gap-2 px-3 py-2.5 text-sm font-medium transition-colors border-b-2 ${
                  activeTab === tab.id
                    ? "border-primary text-primary"
                    : "border-transparent text-muted-foreground hover:text-foreground"
                }`}
              >
                <Icon className="h-4 w-4" />
                {tab.label}
              </button>
            );
          })}
        </nav>
      </div>

      {/* Rules Tab */}
      {activeTab === "rules" && (
        <div className="space-y-4">
          {/* Rule Type Toggle */}
          <div className="flex items-center gap-4">
            <button
              onClick={() => setRuleType("positive")}
              className={`flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-medium transition-colors ${
                ruleType === "positive"
                  ? "bg-emerald-500/10 text-emerald-400"
                  : "bg-muted text-muted-foreground hover:text-foreground"
              }`}
            >
              <ThumbsUp className="h-4 w-4" />
              Positive Rules
            </button>
            <button
              onClick={() => setRuleType("negative")}
              className={`flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-medium transition-colors ${
                ruleType === "negative"
                  ? "bg-rose-500/10 text-rose-400"
                  : "bg-muted text-muted-foreground hover:text-foreground"
              }`}
            >
              <ThumbsDown className="h-4 w-4" />
              Negative Rules
            </button>
          </div>

          {/* Rules Table */}
          <Card>
            <CardContent className="p-0">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-border text-left">
                    <th className="px-4 py-3 text-xs font-medium text-muted-foreground">Rule</th>
                    <th className="px-4 py-3 text-xs font-medium text-muted-foreground">Category</th>
                    <th className="px-4 py-3 text-xs font-medium text-muted-foreground">Points</th>
                    <th className="px-4 py-3 text-xs font-medium text-muted-foreground">Triggered</th>
                    <th className="px-4 py-3 text-xs font-medium text-muted-foreground">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {(ruleType === "positive" ? positiveRules : negativeRules).map((rule) => (
                    <tr key={rule.id} className="border-b border-border">
                      <td className="px-4 py-3 text-sm">{rule.name}</td>
                      <td className="px-4 py-3 text-sm">
                        <Badge variant="outline" className="capitalize">{rule.category}</Badge>
                      </td>
                      <td className="px-4 py-3 text-sm">
                        <span className={ruleType === "positive" ? "text-emerald-400" : "text-rose-400"}>
                          {rule.points > 0 ? "+" : ""}{rule.points}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-sm text-muted-foreground">{rule.count.toLocaleString()}</td>
                      <td className="px-4 py-3">
                        <Button variant="ghost" size="sm">
                          <Edit className="h-4 w-4" />
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Tiers Tab */}
      {activeTab === "tiers" && (
        <Card>
          <CardContent className="p-6">
            <div className="space-y-6">
              <TierConfig tier="hot" color="rose" description="High priority, ready for sales" />
              <TierConfig tier="warm" color="orange" description="Engaged leads, nurture further" />
              <TierConfig tier="cool" color="yellow" description="Needs more engagement" />
              <TierConfig tier="cold" color="cyan" description="Dormant leads, re-engagement needed" />
            </div>
          </CardContent>
        </Card>
      )}

      {/* Leads Tab */}
      {activeTab === "leads" && (
        <Card>
          <CardContent className="p-0">
            <table className="w-full">
              <thead>
                <tr className="border-b border-border text-left">
                  <th className="px-4 py-3 text-xs font-medium text-muted-foreground">Lead</th>
                  <th className="px-4 py-3 text-xs font-medium text-muted-foreground">Company</th>
                  <th className="px-4 py-3 text-xs font-medium text-muted-foreground">Score</th>
                  <th className="px-4 py-3 text-xs font-medium text-muted-foreground">Tier</th>
                  <th className="px-4 py-3 text-xs font-medium text-muted-foreground">Last Activity</th>
                  <th className="px-4 py-3 text-xs font-medium text-muted-foreground">Actions</th>
                </tr>
              </thead>
              <tbody>
                {topScoredLeads.map((lead) => (
                  <tr key={lead.id} className="border-b border-border">
                    <td className="px-4 py-3 text-sm font-medium">{lead.name}</td>
                    <td className="px-4 py-3 text-sm text-muted-foreground">{lead.company}</td>
                    <td className="px-4 py-3 text-sm">
                      <div className="flex items-center gap-2">
                        <div className="h-2 w-16 rounded-full bg-muted">
                          <div
                            className={`h-2 rounded-full ${
                              lead.tier === "hot" ? "bg-rose-500" : "bg-orange-500"
                            }`}
                            style={{ width: `${lead.score}%` }}
                          />
                        </div>
                        <span className="text-sm font-medium">{lead.score}</span>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <Badge variant={lead.tier === "hot" ? "danger" : "warning"} className="capitalize">
                        {lead.tier}
                      </Badge>
                    </td>
                    <td className="px-4 py-3 text-sm text-muted-foreground">{lead.lastActivity}</td>
                    <td className="px-4 py-3">
                      <Button variant="ghost" size="sm">View</Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </CardContent>
        </Card>
      )}
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

function TierRow({ tier, range, color, bgColor, points }: { tier: string; range: string; color: string; bgColor: string; points: string }) {
  return (
    <div className={`flex items-center justify-between rounded-lg ${bgColor} p-3`}>
      <div className="flex items-center gap-3">
        <Flag className={`h-5 w-5 ${color}`} />
        <div>
          <p className={`font-semibold capitalize ${color}`}>{tier}</p>
          <p className="text-xs text-muted-foreground">Score {range}</p>
        </div>
      </div>
      <div className="text-right">
        <p className={`font-semibold ${color}`}>{points} pts/action</p>
        <p className="text-xs text-muted-foreground">per activity</p>
      </div>
    </div>
  );
}

function TierConfig({ tier, color, description }: { tier: string; color: string; description: string }) {
  return (
    <div className="flex items-center justify-between rounded-lg border border-border p-4">
      <div className="flex items-center gap-3">
        <Flag className={`h-5 w-5 text-${color}-400`} />
        <div>
          <p className="font-semibold capitalize">{tier}</p>
          <p className="text-xs text-muted-foreground">{description}</p>
        </div>
      </div>
      <div className="flex items-center gap-2">
        <input
          type="text"
          defaultValue={tier === "hot" ? "80" : tier === "warm" ? "50" : tier === "cool" ? "20" : "0"}
          className="flex h-8 w-16 rounded-lg border border-border bg-card px-2 text-center text-sm"
        />
        <span className="text-sm text-muted-foreground">-</span>
        <input
          type="text"
          defaultValue={tier === "hot" ? "100" : tier === "warm" ? "79" : tier === "cool" ? "49" : "19"}
          className="flex h-8 w-16 rounded-lg border border-border bg-card px-2 text-center text-sm"
        />
        <Button variant="ghost" size="sm">
          <Edit className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}
