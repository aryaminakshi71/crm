/**
 * Marketing Analytics
 *
 * Attribution tracking, heatmaps, and click tracking analytics.
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
  ArrowRight,
  BarChart3,
  Bell,
  CheckCircle,
  DollarSign,
  Eye,
  Filter,
  Globe,
  Grid3X3,
  Link2,
  List,
  Mail,
  MousePointerClick,
  Plus,
  Search,
  Share2,
  Target,
  TrendingDown,
  TrendingUp,
  Users,
  X,
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
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

export const Route = createFileRoute("/app/marketing/analytics")({
  component: MarketingAnalytics,
});

const CHART_COLORS = ["#22d3ee", "#a78bfa", "#f472b6", "#34d399", "#fbbf24"];

const trafficSources = [
  { source: "Direct", visitors: 12450, conversions: 456, revenue: 91200, percentage: 35 },
  { source: "Organic Search", visitors: 8900, conversions: 234, revenue: 46800, percentage: 25 },
  { source: "Email", visitors: 6700, conversions: 567, revenue: 113400, percentage: 19 },
  { source: "Social Media", visitors: 4500, conversions: 123, revenue: 24600, percentage: 13 },
  { source: "Paid Ads", visitors: 3200, conversions: 289, revenue: 57800, percentage: 8 },
];

const attributionData = [
  { date: "Week 1", firstTouch: 1200, lastTouch: 980, linear: 1100, decay: 1050 },
  { date: "Week 2", firstTouch: 1350, lastTouch: 1120, linear: 1240, decay: 1180 },
  { date: "Week 3", firstTouch: 1480, lastTouch: 1290, linear: 1380, decay: 1320 },
  { date: "Week 4", firstTouch: 1620, lastTouch: 1450, linear: 1540, decay: 1480 },
];

const campaignAttribution = [
  { campaign: "Spring Sale Email", conversions: 234, revenue: 46800, touchpoints: 3.2 },
  { campaign: "Product Launch Social", conversions: 156, revenue: 31200, touchpoints: 4.1 },
  { campaign: "Google Ads - Brand", conversions: 189, revenue: 37800, touchpoints: 1.8 },
  { campaign: "Content Marketing", conversions: 98, revenue: 19600, touchpoints: 5.4 },
];

const deviceData = [
  { device: "Desktop", visitors: 18500, percentage: 52, conversions: 890 },
  { device: "Mobile", visitors: 14200, percentage: 40, conversions: 456 },
  { device: "Tablet", visitors: 2800, percentage: 8, conversions: 89 },
];

const locationData = [
  { country: "United States", visitors: 18500, conversions: 678, revenue: 135600 },
  { country: "United Kingdom", visitors: 4200, conversions: 156, revenue: 31200 },
  { country: "Germany", visitors: 3100, conversions: 112, revenue: 22400 },
  { country: "Canada", visitors: 2800, conversions: 98, revenue: 19600 },
  { country: "France", visitors: 2100, conversions: 78, revenue: 15600 },
];

const heatmapData = [
  { section: "Hero CTA", clicks: 4521, engagement: "high" },
  { section: "Pricing Button", clicks: 3245, engagement: "high" },
  { section: "Feature Grid", clicks: 2890, engagement: "medium" },
  { section: "Testimonials", clicks: 1876, engagement: "medium" },
  { section: "FAQ Section", clicks: 1234, engagement: "low" },
  { section: "Footer Links", clicks: 987, engagement: "low" },
];

function MarketingAnalytics() {
  const [dateRange, setDateRange] = useState("30d");
  const [activeTab, setActiveTab] = useState<"overview" | "attribution" | "heatmap" | "tracking">("overview");

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
            <h2 className="font-bold text-xl text-foreground">Marketing Analytics</h2>
            <p className="text-sm text-muted-foreground">Attribution tracking and performance analytics</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <select
            value={dateRange}
            onChange={(e) => setDateRange(e.target.value)}
            className="flex h-10 rounded-lg border border-border bg-card px-3 py-2 text-sm"
          >
            <option value="7d">Last 7 days</option>
            <option value="30d">Last 30 days</option>
            <option value="90d">Last 90 days</option>
            <option value="ytd">Year to date</option>
          </select>
          <Button variant="outline" size="sm" leftIcon={<Share2 className="h-4 w-4" />}>
            Export
          </Button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
        <StatCard title="Total Visitors" value="35.5K" trend="+12.3%" icon={<Globe className="h-4 w-4" />} color="text-primary" />
        <StatCard title="Conversions" value="1,435" trend="+8.7%" icon={<Target className="h-4 w-4" />} color="text-emerald-400" />
        <StatCard title="Conversion Rate" value="4.04%" trend="+0.3%" icon={<TrendingUp className="h-4 w-4" />} color="text-violet-400" />
        <StatCard title="Revenue Attributed" value="$334.9K" trend="+15.2%" icon={<DollarSign className="h-4 w-4" />} color="text-amber-400" />
      </div>

      {/* Tabs */}
      <div className="border-b border-border">
        <nav className="flex gap-4">
          {[
            { id: "overview", label: "Overview", icon: BarChart3 },
            { id: "attribution", label: "Attribution", icon: Link2 },
            { id: "heatmap", label: "Heatmaps", icon: Grid3X3 },
            { id: "tracking", label: "Event Tracking", icon: MousePointerClick },
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

      {/* Overview Tab */}
      {activeTab === "overview" && (
        <div className="space-y-6">
          {/* Traffic Sources */}
          <Card>
            <CardHeader>
              <CardTitle className="text-sm font-bold uppercase tracking-tight text-muted-foreground">
                Traffic Sources
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
                <div className="h-[250px] w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={trafficSources}
                        cx="50%"
                        cy="50%"
                        innerRadius={50}
                        outerRadius={90}
                        paddingAngle={2}
                        dataKey="visitors"
                        nameKey="source"
                      >
                        {trafficSources.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={CHART_COLORS[index % CHART_COLORS.length]} />
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
                <div className="space-y-3">
                  {trafficSources.map((source, index) => (
                    <div key={source.source} className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <div className="h-3 w-3 rounded-full" style={{ backgroundColor: CHART_COLORS[index % CHART_COLORS.length] }} />
                        <span className="text-sm">{source.source}</span>
                      </div>
                      <div className="flex items-center gap-4 text-sm">
                        <span className="text-muted-foreground">{source.visitors.toLocaleString()}</span>
                        <span className="font-medium">{source.percentage}%</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Device Breakdown */}
          <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle className="text-sm font-bold uppercase tracking-tight text-muted-foreground">
                  Device Breakdown
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {deviceData.map((device) => (
                    <div key={device.device}>
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-sm">{device.device}</span>
                        <span className="text-sm font-medium">{device.percentage}%</span>
                      </div>
                      <div className="h-2 w-full rounded-full bg-muted">
                        <div className="h-2 rounded-full bg-primary" style={{ width: `${device.percentage}%` }} />
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-sm font-bold uppercase tracking-tight text-muted-foreground">
                  Top Locations
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {locationData.slice(0, 5).map((location, index) => (
                    <div key={location.country} className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="flex h-6 w-6 items-center justify-center rounded-full bg-muted text-xs font-bold">
                          {index + 1}
                        </span>
                        <span className="text-sm">{location.country}</span>
                      </div>
                      <div className="flex items-center gap-3 text-sm">
                        <span className="text-muted-foreground">{location.visitors.toLocaleString()}</span>
                        <span className="font-medium text-emerald-400">{location.conversions} conv.</span>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      )}

      {/* Attribution Tab */}
      {activeTab === "attribution" && (
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-sm font-bold uppercase tracking-tight text-muted-foreground">
                Attribution Models Comparison
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-[300px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={attributionData}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(255,255,255,0.05)" />
                    <XAxis dataKey="date" axisLine={false} tickLine={false} fontSize={10} stroke="#888" />
                    <YAxis axisLine={false} tickLine={false} fontSize={10} stroke="#888" />
                    <Tooltip
                      contentStyle={{
                        background: "#0f172a",
                        border: "none",
                        borderRadius: "12px",
                        fontSize: "11px",
                      }}
                    />
                    <Line type="monotone" dataKey="firstTouch" stroke="#22d3ee" strokeWidth={2} dot={false} />
                    <Line type="monotone" dataKey="lastTouch" stroke="#a78bfa" strokeWidth={2} dot={false} />
                    <Line type="monotone" dataKey="linear" stroke="#34d399" strokeWidth={2} dot={false} />
                    <Line type="monotone" dataKey="decay" stroke="#fbbf24" strokeWidth={2} dot={false} />
                  </LineChart>
                </ResponsiveContainer>
              </div>
              <div className="mt-4 flex justify-center gap-6">
                <div className="flex items-center gap-2">
                  <div className="h-2 w-4 rounded-full bg-[#22d3ee]" />
                  <span className="text-xs text-muted-foreground">First Touch</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="h-2 w-4 rounded-full bg-[#a78bfa]" />
                  <span className="text-xs text-muted-foreground">Last Touch</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="h-2 w-4 rounded-full bg-[#34d399]" />
                  <span className="text-xs text-muted-foreground">Linear</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="h-2 w-4 rounded-full bg-[#fbbf24]" />
                  <span className="text-xs text-muted-foreground">Decay</span>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-sm font-bold uppercase tracking-tight text-muted-foreground">
                Campaign Attribution
              </CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-border text-left">
                    <th className="px-4 py-3 text-xs font-medium text-muted-foreground">Campaign</th>
                    <th className="px-4 py-3 text-xs font-medium text-muted-foreground">Conversions</th>
                    <th className="px-4 py-3 text-xs font-medium text-muted-foreground">Revenue</th>
                    <th className="px-4 py-3 text-xs font-medium text-muted-foreground">Avg Touchpoints</th>
                  </tr>
                </thead>
                <tbody>
                  {campaignAttribution.map((campaign) => (
                    <tr key={campaign.campaign} className="border-b border-border">
                      <td className="px-4 py-3 text-sm font-medium">{campaign.campaign}</td>
                      <td className="px-4 py-3 text-sm">{campaign.conversions}</td>
                      <td className="px-4 py-3 text-sm text-emerald-400">${campaign.revenue.toLocaleString()}</td>
                      <td className="px-4 py-3 text-sm">{campaign.touchpoints}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Heatmap Tab */}
      {activeTab === "heatmap" && (
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-sm font-bold uppercase tracking-tight text-muted-foreground">
                Page Heatmap - Landing Page
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
                <div className="relative rounded-lg bg-gradient-to-br from-primary/20 via-violet-500/10 to-primary/20 p-8">
                  {/* Simulated heatmap visualization */}
                  <div className="relative min-h-[400px]">
                    <div className="absolute top-0 left-1/2 -translate-x-1/2 px-8 py-4 bg-rose-500/80 text-white text-center rounded-lg">
                      <p className="font-bold">Hero CTA</p>
                      <p className="text-xs">4521 clicks</p>
                    </div>
                    <div className="absolute top-1/4 left-1/4 px-6 py-3 bg-amber-500/70 text-white text-center rounded-lg">
                      <p className="font-bold">Feature Grid</p>
                      <p className="text-xs">2890 clicks</p>
                    </div>
                    <div className="absolute top-1/4 right-1/4 px-6 py-3 bg-amber-500/70 text-white text-center rounded-lg">
                      <p className="font-bold">Pricing</p>
                      <p className="text-xs">3245 clicks</p>
                    </div>
                    <div className="absolute top-1/2 left-1/2 -translate-x-1/2 px-6 py-3 bg-emerald-500/70 text-white text-center rounded-lg">
                      <p className="font-bold">Testimonials</p>
                      <p className="text-xs">1876 clicks</p>
                    </div>
                    <div className="absolute bottom-1/4 left-1/2 -translate-x-1/2 px-6 py-3 bg-cyan-500/70 text-white text-center rounded-lg">
                      <p className="font-bold">FAQ</p>
                      <p className="text-xs">1234 clicks</p>
                    </div>
                    <div className="absolute bottom-0 left-1/2 -translate-x-1/2 px-6 py-3 bg-blue-500/70 text-white text-center rounded-lg">
                      <p className="font-bold">Footer</p>
                      <p className="text-xs">987 clicks</p>
                    </div>
                  </div>
                </div>
                <div className="space-y-4">
                  <h4 className="font-medium">Click Engagement by Section</h4>
                  {heatmapData.map((section) => (
                    <div key={section.section}>
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-sm">{section.section}</span>
                        <span className="text-sm font-medium">{section.clicks.toLocaleString()}</span>
                      </div>
                      <div className="h-3 w-full rounded-full bg-muted">
                        <div
                          className={`h-3 rounded-full ${
                            section.engagement === "high" ? "bg-rose-400" : section.engagement === "medium" ? "bg-amber-400" : "bg-cyan-400"
                          }`}
                          style={{ width: `${(section.clicks / 5000) * 100}%` }}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Tracking Tab */}
      {activeTab === "tracking" && (
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-sm font-bold uppercase tracking-tight text-muted-foreground">
                Tracked Events
              </CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-border text-left">
                    <th className="px-4 py-3 text-xs font-medium text-muted-foreground">Event Name</th>
                    <th className="px-4 py-3 text-xs font-medium text-muted-foreground">Category</th>
                    <th className="px-4 py-3 text-xs font-medium text-muted-foreground">Last 7 Days</th>
                    <th className="px-4 py-3 text-xs font-medium text-muted-foreground">Last 30 Days</th>
                    <th className="px-4 py-3 text-xs font-medium text-muted-foreground">Trend</th>
                  </tr>
                </thead>
                <tbody>
                  {[
                    { name: "page_view", category: "Page", week: 12450, month: 48500, trend: 12 },
                    { name: "cta_click", category: "Interaction", week: 2341, month: 8900, trend: 8 },
                    { name: "form_submit", category: "Conversion", week: 456, month: 1789, trend: -3 },
                    { name: "video_play", category: "Media", week: 890, month: 3450, trend: 15 },
                    { name: "download", category: "Content", week: 234, month: 912, trend: 5 },
                  ].map((event) => (
                    <tr key={event.name} className="border-b border-border">
                      <td className="px-4 py-3 text-sm font-medium">{event.name}</td>
                      <td className="px-4 py-3 text-sm">
                        <Badge variant="outline">{event.category}</Badge>
                      </td>
                      <td className="px-4 py-3 text-sm">{event.week.toLocaleString()}</td>
                      <td className="px-4 py-3 text-sm">{event.month.toLocaleString()}</td>
                      <td className="px-4 py-3 text-sm">
                        <span className={event.trend > 0 ? "text-emerald-400" : "text-rose-400"}>
                          {event.trend > 0 ? "+" : ""}{event.trend}%
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}

function StatCard({ title, value, trend, icon, color }: { title: string; value: string; trend: string; icon: React.ReactNode; color: string }) {
  const trendPositive = trend.startsWith("+");
  return (
    <Card className="border-border/60">
      <CardContent className="p-4">
        <div className="flex items-center justify-between gap-3">
          <div>
            <p className="text-muted-foreground text-[10px] font-black uppercase tracking-widest">{title}</p>
            <p className="font-black text-xl text-foreground mt-0.5">{value}</p>
            <div className="mt-1 flex items-center gap-1">
              {trendPositive ? (
                <TrendingUp className="h-3 w-3 text-emerald-400" />
              ) : (
                <TrendingDown className="h-3 w-3 text-rose-400" />
              )}
              <span className={`text-[10px] font-bold ${trendPositive ? "text-emerald-400" : "text-rose-400"}`}>
                {trend}
              </span>
            </div>
          </div>
          <div className={`rounded-xl bg-muted/30 p-2 ${color}`}>{icon}</div>
        </div>
      </CardContent>
    </Card>
  );
}
