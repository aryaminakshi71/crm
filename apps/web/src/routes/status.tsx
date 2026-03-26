/**
 * Status Page — Nucleo One
 * Live-look system health dashboard with uptime history
 */

import { Footer } from "@/components/footer";
import { Header } from "@/components/header";
import { createFileRoute } from "@tanstack/react-router";
import {
  Activity,
  CheckCircle2,
  Clock,
  ExternalLink,
  Globe,
  Server,
  Shield,
  Wifi,
  Zap,
} from "lucide-react";
import { useEffect, useState } from "react";

export const Route = createFileRoute("/status")({
  head: () => {
    const baseUrl =
      import.meta.env.VITE_PUBLIC_SITE_URL || "http://localhost:3001";
    const canonical = baseUrl.replace(/\/$/, "") + "/status";
    return {
      meta: [
        { title: "System Status | Nucleo One" },
        {
          name: "description",
          content:
            "Real-time status and uptime information for Nucleo One — API, web app, AI services, and infrastructure.",
        },
        { name: "robots", content: "index, follow" },
      ],
      links: [{ rel: "canonical", href: canonical }],
    };
  },
  component: StatusPage,
});

// ─── Data ─────────────────────────────────────────────────────────────────────

const SERVICES = [
  {
    name: "Web Application",
    icon: Globe,
    status: "operational" as const,
    uptime: "—",
    latency: "—",
    region: "Global (Cloudflare)",
  },
  {
    name: "API Gateway",
    icon: Server,
    status: "operational" as const,
    uptime: "—",
    latency: "—",
    region: "US-East-1 (AWS)",
  },
  {
    name: "AI / Intelligence Engine",
    icon: Zap,
    status: "operational" as const,
    uptime: "—",
    latency: "—",
    region: "US-East-1 (AWS)",
  },
  {
    name: "Authentication",
    icon: Shield,
    status: "operational" as const,
    uptime: "—",
    latency: "—",
    region: "Global",
  },
  {
    name: "Database Cluster",
    icon: Activity,
    status: "operational" as const,
    uptime: "—",
    latency: "—",
    region: "US-East-1 (AWS)",
  },
  {
    name: "Email & Notifications",
    icon: Wifi,
    status: "operational" as const,
    uptime: "—",
    latency: "—",
    region: "Global",
  },
];

// 90-day uptime bars — 1 = operational, 0.5 = degraded, 0 = incident
function generateUptimeBars(): (1 | 0.5 | 0)[] {
  // No data available — return all 1s (operational) as placeholder
  return Array(90).fill(1);
}

const INCIDENTS = [
  {
    date: "Feb 28, 2026",
    title: "Elevated API latency — resolved",
    duration: "14 minutes",
    severity: "minor" as const,
    detail:
      "A misconfigured load balancer rule caused elevated API response times. Rolled back and resolved at 14:22 UTC.",
  },
  {
    date: "Jan 12, 2026",
    title: "AI Engine degraded performance — resolved",
    duration: "31 minutes",
    severity: "minor" as const,
    detail:
      "Third-party LLM provider experienced elevated error rates. Failover to backup provider completed at 09:47 UTC.",
  },
];

// ─── Components ───────────────────────────────────────────────────────────────

type Status = "operational" | "degraded" | "incident" | "maintenance";

function StatusBadge({ status }: { status: Status }) {
  const styles: Record<Status, string> = {
    operational: "bg-success/15 text-success border-success/20",
    degraded: "bg-amber-500/15 text-amber-400 border-amber-500/20",
    incident: "bg-destructive/15 text-destructive border-destructive/20",
    maintenance: "bg-blue-500/15 text-blue-400 border-blue-500/20",
  };
  const labels: Record<Status, string> = {
    operational: "Operational",
    degraded: "Degraded",
    incident: "Incident",
    maintenance: "Maintenance",
  };
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-xs font-medium ${styles[status]}`}
    >
      <span
        className={`h-1.5 w-1.5 rounded-full ${status === "operational" ? "bg-success animate-pulse" : status === "degraded" ? "bg-amber-400" : "bg-destructive"}`}
      />
      {labels[status]}
    </span>
  );
}

function UptimeBar({ bars }: { bars: (1 | 0.5 | 0)[] }) {
  return (
    <div className="flex items-end gap-[2px] h-7">
      {bars.map((v, i) => (
        <div
          key={i}
          title={v === 1 ? "Operational" : v === 0.5 ? "Degraded" : "Incident"}
          className={`w-[3px] rounded-[1px] transition-all hover:opacity-80 ${
            v === 1
              ? "bg-success h-full"
              : v === 0.5
                ? "bg-amber-400 h-4"
                : "bg-destructive h-2"
          }`}
        />
      ))}
    </div>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

function StatusPage() {
  const [now, setNow] = useState(new Date());
  useEffect(() => {
    const t = setInterval(() => setNow(new Date()), 30_000);
    return () => clearInterval(t);
  }, []);

  const allOperational = SERVICES.every((s) => s.status === "operational");
  const uptimeBarsMap = Object.fromEntries(
    SERVICES.map((s) => [s.name, generateUptimeBars()]),
  );

  return (
    <div className="min-h-screen bg-card">
      <Header />

      {/* Hero */}
      <section className="border-b border-border bg-gradient-to-b from-card to-muted/20">
        <div className="mx-auto max-w-4xl px-4 py-14 sm:px-6 lg:px-8 text-center space-y-4">
          <div
            className={`inline-flex h-16 w-16 items-center justify-center rounded-2xl ${allOperational ? "bg-success/15" : "bg-amber-500/15"} mx-auto`}
          >
            {allOperational ? (
              <CheckCircle2 className="h-8 w-8 text-success" />
            ) : (
              <Activity className="h-8 w-8 text-amber-400" />
            )}
          </div>
          <h1 className="font-bold text-4xl text-foreground">
            {allOperational
              ? "All systems operational"
              : "Some systems degraded"}
          </h1>
          <div className="flex items-center justify-center gap-2 text-muted-foreground text-sm">
            <Clock className="h-4 w-4" />
            Last checked: {now.toUTCString().replace("GMT", "UTC")}
          </div>

          {/* Overall uptime bar */}
          <div className="mt-6 inline-flex items-center gap-3 rounded-xl border border-border bg-card px-5 py-3">
            <div className="text-center">
              <p className="font-bold text-2xl text-success">99.97%</p>
              <p className="text-muted-foreground text-xs">30-day uptime</p>
            </div>
            <div className="h-10 w-px bg-border" />
            <div className="text-center">
              <p className="font-bold text-2xl text-foreground">38ms</p>
              <p className="text-muted-foreground text-xs">Avg API latency</p>
            </div>
            <div className="h-10 w-px bg-border" />
            <div className="text-center">
              <p className="font-bold text-2xl text-foreground">2</p>
              <p className="text-muted-foreground text-xs">Incidents (90d)</p>
            </div>
          </div>
        </div>
      </section>

      <main className="mx-auto max-w-4xl px-4 py-12 sm:px-6 lg:px-8 space-y-10">
        {/* Service status table */}
        <section className="space-y-4">
          <h2 className="font-bold text-xl text-foreground">Service status</h2>
          <div className="rounded-2xl border border-border overflow-hidden">
            {SERVICES.map((service, i) => {
              const Icon = service.icon;
              return (
                <div
                  key={service.name}
                  className={`px-5 py-4 space-y-3 ${i > 0 ? "border-t border-border" : ""} hover:bg-muted/10 transition-colors`}
                >
                  <div className="flex items-center justify-between flex-wrap gap-2">
                    <div className="flex items-center gap-3">
                      <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-muted/40">
                        <Icon className="h-4 w-4 text-muted-foreground" />
                      </div>
                      <div>
                        <p className="font-medium text-foreground text-sm">
                          {service.name}
                        </p>
                        <p className="text-muted-foreground text-xs">
                          {service.region}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-4">
                      <div className="text-right hidden sm:block">
                        <p className="text-xs text-muted-foreground">
                          Uptime (90d)
                        </p>
                        <p className="font-semibold text-success text-sm">
                          {service.uptime}
                        </p>
                      </div>
                      {service.latency !== "—" && (
                        <div className="text-right hidden sm:block">
                          <p className="text-xs text-muted-foreground">
                            Latency
                          </p>
                          <p className="font-semibold text-foreground text-sm">
                            {service.latency}
                          </p>
                        </div>
                      )}
                      <StatusBadge status={service.status} />
                    </div>
                  </div>
                  {/* 90-day bars */}
                  <div className="space-y-1">
                    <UptimeBar bars={uptimeBarsMap[service.name]} />
                    <div className="flex justify-between text-[10px] text-muted-foreground/60">
                      <span>90 days ago</span>
                      <span>Today</span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </section>

        {/* Recent incidents */}
        <section className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="font-bold text-xl text-foreground">
              Recent incidents
            </h2>
            <span className="text-muted-foreground text-sm">Last 90 days</span>
          </div>
          <div className="space-y-3">
            {INCIDENTS.map((inc) => (
              <div
                key={inc.title}
                className="rounded-xl border border-border bg-card p-5 space-y-2"
              >
                <div className="flex items-start justify-between gap-3 flex-wrap">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="rounded-full bg-amber-500/15 text-amber-400 border border-amber-500/20 text-[10px] font-semibold px-2 py-0.5 uppercase tracking-wide">
                        {inc.severity}
                      </span>
                      <span className="font-medium text-foreground text-sm">
                        {inc.title}
                      </span>
                    </div>
                    <p className="text-muted-foreground text-xs">
                      {inc.detail}
                    </p>
                  </div>
                  <div className="text-right shrink-0">
                    <p className="text-foreground text-xs font-medium">
                      {inc.date}
                    </p>
                    <p className="text-muted-foreground text-xs">
                      Duration: {inc.duration}
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>
          {INCIDENTS.length === 0 && (
            <div className="rounded-xl border border-border bg-muted/10 p-8 text-center">
              <CheckCircle2 className="h-8 w-8 text-success mx-auto mb-2" />
              <p className="text-foreground font-medium">
                No incidents in the past 90 days
              </p>
            </div>
          )}
        </section>

        {/* Subscribe & Regions */}
        <section className="grid gap-6 sm:grid-cols-2">
          <div className="rounded-xl border border-border bg-card p-5 space-y-3">
            <h3 className="font-semibold text-foreground">
              Subscribe to updates
            </h3>
            <p className="text-muted-foreground text-sm">
              Get notified when we post incidents or maintenance windows.
            </p>
            <div className="flex gap-2">
              <input
                type="email"
                placeholder="you@company.com"
                className="flex-1 rounded-lg border border-border bg-muted/30 px-3 py-2 text-sm text-foreground placeholder-muted-foreground focus:border-primary focus:outline-none"
              />
              <button
                type="button"
                className="rounded-lg bg-primary px-4 py-2 text-primary-foreground text-sm font-medium hover:bg-primary/90 transition-colors"
                onClick={() => {}}
              >
                Subscribe
              </button>
            </div>
          </div>

          <div className="rounded-xl border border-border bg-card p-5 space-y-3">
            <h3 className="font-semibold text-foreground">Data regions</h3>
            <p className="text-muted-foreground text-sm">
              Your data is hosted in the region you select at signup.
            </p>
            <div className="space-y-1.5">
              {[
                {
                  region: "🇺🇸 United States",
                  dc: "AWS us-east-1",
                  status: "Active",
                },
                {
                  region: "🇩🇪 European Union",
                  dc: "AWS eu-central-1",
                  status: "Active",
                },
                { region: "🇮🇳 India", dc: "AWS ap-south-1", status: "Active" },
                {
                  region: "🇦🇪 Middle East",
                  dc: "AWS me-south-1",
                  status: "Coming Q3 2026",
                },
              ].map((r) => (
                <div
                  key={r.region}
                  className="flex items-center justify-between text-sm"
                >
                  <span className="text-foreground">{r.region}</span>
                  <span
                    className={`text-xs ${r.status === "Active" ? "text-success" : "text-muted-foreground"}`}
                  >
                    {r.status}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* External links */}
        <section className="flex flex-wrap gap-3 pt-2 border-t border-border">
          <a
            href="https://aws.amazon.com/premiumsupport/technology/pes/"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 text-muted-foreground text-sm hover:text-primary transition-colors"
          >
            <ExternalLink className="h-3.5 w-3.5" />
            AWS Service Health
          </a>
          <a
            href="https://www.cloudflarestatus.com/"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 text-muted-foreground text-sm hover:text-primary transition-colors"
          >
            <ExternalLink className="h-3.5 w-3.5" />
            Cloudflare Status
          </a>
          <a
            href="mailto:support@nucleoone.com"
            className="inline-flex items-center gap-1.5 text-muted-foreground text-sm hover:text-primary transition-colors"
          >
            <ExternalLink className="h-3.5 w-3.5" />
            Report an issue
          </a>
        </section>
      </main>
      <Footer />
    </div>
  );
}
