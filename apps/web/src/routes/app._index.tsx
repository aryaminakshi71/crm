/**
 * Dashboard Route
 *
 * Main dashboard showing key metrics and recent activity.
 */

import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  LoadingSkeleton,
} from "@crm/ui";
import { useQuery } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";
import {
  ArrowDownRight,
  ArrowUpRight,
  DollarSign,
  Target,
  TrendingUp,
  Users,
} from "lucide-react";
import { useEffect, useState } from "react";
import { dashboardApi } from "../lib/api";

export const Route = createFileRoute("/app/_index")({
  component: DashboardPage,
});

function DashboardPage() {
  // Fix hydration mismatch by only rendering data on client
  const [isClient, setIsClient] = useState(false);
  useEffect(() => {
    setIsClient(true);
  }, []);

  const {
    data: statsData,
    isLoading,
    error,
  } = useQuery({
    queryKey: ["dashboard-stats"],
    queryFn: () => dashboardApi.getStats(),
    enabled: isClient, // Only fetch on client
  });

  if (!isClient || isLoading) {
    return <DashboardSkeleton />;
  }

  if (error) {
    return (
      <div className="space-y-8">
        <div>
          <h1 className="font-bold text-2xl text-foreground">Dashboard</h1>
          <p className="text-muted-foreground">
            Welcome back! Here's what's happening today.
          </p>
        </div>
        <Card>
          <CardContent className="p-6">
            <p className="text-destructive">
              Failed to load dashboard data. Please try again.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  const stats = [
    {
      name: "Total Contacts",
      value: statsData?.totalContacts?.toLocaleString() || "0",
      change: `${(statsData?.contactsChange ?? 0) >= 0 ? "+" : ""}${statsData?.contactsChange ?? 0}%`,
      trend: (statsData?.contactsChange ?? 0) >= 0 ? "up" : "down",
      icon: Users,
    },
    {
      name: "Active Deals",
      value: statsData?.activeDeals?.toString() || "0",
      change: `${(statsData?.dealsChange ?? 0) >= 0 ? "+" : ""}${statsData?.dealsChange ?? 0}%`,
      trend: (statsData?.dealsChange ?? 0) >= 0 ? "up" : "down",
      icon: Target,
    },
    {
      name: "Conversion Rate",
      value: `${statsData?.conversionRate ?? 0}%`,
      change: `${(statsData?.conversionChange ?? 0) >= 0 ? "+" : ""}${statsData?.conversionChange ?? 0}%`,
      trend: (statsData?.conversionChange ?? 0) >= 0 ? "up" : "down",
      icon: TrendingUp,
    },
    {
      name: "Revenue",
      value: `$${statsData?.revenue?.toLocaleString() || "0"}`,
      change: `${(statsData?.revenueChange ?? 0) >= 0 ? "+" : ""}${statsData?.revenueChange ?? 0}%`,
      trend: (statsData?.revenueChange ?? 0) >= 0 ? "up" : "down",
      icon: DollarSign,
    },
  ];

  const recentActivities = statsData?.recentActivities || [];
  const pipeline = statsData?.pipeline || [];

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="font-bold text-2xl text-foreground">Dashboard</h1>
        <p className="text-muted-foreground">
          Welcome back! Here's what's happening today.
        </p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-4">
        {stats.map((stat) => (
          <Card key={stat.name}>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium text-muted-foreground text-sm">
                    {stat.name}
                  </p>
                  <p className="mt-1 font-bold text-2xl text-foreground">
                    {stat.value}
                  </p>
                </div>
                <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10">
                  <stat.icon className="h-6 w-6 text-primary" />
                </div>
              </div>
              <div className="mt-3 flex items-center gap-1">
                {stat.trend === "up" ? (
                  <ArrowUpRight className="h-4 w-4 text-success" />
                ) : (
                  <ArrowDownRight className="h-4 w-4 text-destructive" />
                )}
                <span
                  className={
                    stat.trend === "up" ? "text-success" : "text-destructive"
                  }
                >
                  {stat.change}
                </span>
                <span className="text-muted-foreground text-sm">
                  vs last month
                </span>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {/* Recent Activity */}
        <Card>
          <CardHeader>
            <CardTitle>Recent Activity</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {recentActivities.map(
                (activity: { id: string; message: string; time: string }) => (
                  <div key={activity.id} className="flex items-start gap-4">
                    <div className="mt-2 h-2 w-2 rounded-full bg-primary" />
                    <div className="min-w-0 flex-1">
                      <p className="text-foreground text-sm">
                        {activity.message}
                      </p>
                      <p className="text-muted-foreground text-xs">
                        {activity.time}
                      </p>
                    </div>
                  </div>
                ),
              )}
            </div>
          </CardContent>
        </Card>

        {/* Pipeline Overview */}
        <Card>
          <CardHeader>
            <CardTitle>Pipeline Overview</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {pipeline.length > 0 ? (
                pipeline.map(
                  (stage: { stage: string; value: number; count: number }) => {
                    const totalValue = pipeline.reduce(
                      (sum: number, s: { value: number }) => sum + s.value,
                      0,
                    );
                    const percentage =
                      totalValue > 0 ? (stage.value / totalValue) * 100 : 0;
                    return (
                      <div
                        key={stage.stage}
                        className="flex items-center gap-4"
                      >
                        <div className="w-24 font-medium text-muted-foreground text-sm capitalize">
                          {stage.stage}
                        </div>
                        <div className="h-2 flex-1 overflow-hidden rounded-full bg-muted">
                          <div
                            className="h-full rounded-full bg-primary transition-all"
                            style={{ width: `${percentage}%` }}
                          />
                        </div>
                        <div className="text-right">
                          <p className="font-medium text-foreground text-sm">
                            ${stage.value.toLocaleString()}
                          </p>
                          <p className="text-muted-foreground text-xs">
                            {stage.count} deals
                          </p>
                        </div>
                      </div>
                    );
                  },
                )
              ) : (
                <p className="text-muted-foreground text-sm">
                  No deals in pipeline
                </p>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

function DashboardSkeleton() {
  return (
    <div className="space-y-8">
      <div>
        <h1 className="font-bold text-2xl text-foreground">Dashboard</h1>
        <p className="text-muted-foreground">
          Welcome back! Here's what's happening today.
        </p>
      </div>
      <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-4">
        {[1, 2, 3, 4].map((i) => (
          <Card key={i}>
            <CardContent className="p-6">
              <LoadingSkeleton className="h-20" />
            </CardContent>
          </Card>
        ))}
      </div>
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Recent Activity</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {[1, 2, 3, 4].map((i) => (
                <LoadingSkeleton key={i} className="h-12" />
              ))}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Pipeline Overview</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {[1, 2, 3, 4, 5].map((i) => (
                <LoadingSkeleton key={i} className="h-8" />
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
