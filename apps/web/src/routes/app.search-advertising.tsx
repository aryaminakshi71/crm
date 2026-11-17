import {
  Badge,
  Button,
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  EmptyState,
  Loading,
} from "@crm/ui";
import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import {
  DollarSign,
  Globe,
  MousePointerClick,
  Plus,
  Search,
  Settings,
  TrendingUp,
  Link2,
} from "lucide-react";
import { z } from "zod";
import { advertisingApi } from "@/lib/api";

// ─── Route ─────────────────────────────────────────────────────────────────

export const Route = createFileRoute("/app/search-advertising")({
  validateSearch: z.object({}),
  component: SearchAdvertisingPage,
});

// ─── Metric Component ───────────────────────────────────────────────────────

function Metric({
  title,
  value,
  icon,
  trend,
  color,
}: {
  title: string;
  value: string | number;
  icon?: React.ReactNode;
  trend?: string;
  color?: string;
}) {
  return (
    <Card className="border-border/60">
      <CardContent className="p-4">
        <div className="flex items-center justify-between gap-3">
          <div>
            <p className="text-muted-foreground text-[10px] font-black uppercase tracking-widest">
              {title}
            </p>
            <p className="font-black text-2xl text-foreground mt-0.5">
              {value}
            </p>
            {trend && (
              <p className="text-muted-foreground text-xs mt-1">{trend}</p>
            )}
          </div>
          <div
            className={`rounded-xl bg-muted/30 p-2.5 ${color || "text-primary"}`}
          >
            {icon || <Search className="h-4 w-4" />}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

// ─── Page Component ─────────────────────────────────────────────────────────

function SearchAdvertisingPage() {
  // Fetch ad network connection status
  const { data: connectionStatus, isLoading: statusLoading } = useQuery({
    queryKey: ["advertising", "status"],
    queryFn: () => advertisingApi.getStatus(),
  });

  // Fetch dashboard overview
  const { data: overview, isLoading: overviewLoading } = useQuery({
    queryKey: ["advertising", "overview"],
    queryFn: () => advertisingApi.overview(),
  });

  // Fetch campaigns
  const { data: campaigns, isLoading: campaignsLoading } = useQuery({
    queryKey: ["advertising", "campaigns"],
    queryFn: () => advertisingApi.campaigns(),
  });

  const isLoading = statusLoading || overviewLoading || campaignsLoading;

  // Find Google Ads connection status
  const googleAdsConnected = (connectionStatus as any)?.find(
    (s: any) => s.adNetwork === "google_ads" && s.connected,
  );

  // Format currency
  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(value);
  };

  // Format number
  const formatNumber = (value: number) => {
    if (value >= 1000000) {
      return `${(value / 1000000).toFixed(1)}M`;
    }
    if (value >= 1000) {
      return `${(value / 1000).toFixed(1)}K`;
    }
    return value.toString();
  };

  if (isLoading) {
    return <Loading text="Loading advertising data..." />;
  }

  // Show setup state if not connected
  if (!googleAdsConnected) {
    return (
      <div className="space-y-6">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h1 className="font-bold text-2xl text-foreground">
              Search Advertising
            </h1>
            <p className="text-muted-foreground text-sm">
              Connect your ad accounts to track conversions and performance.
            </p>
          </div>
        </div>

        <EmptyState
          icon={<Link2 className="h-12 w-12" />}
          title="Connect Your Ad Account"
          description="Start tracking your search advertising campaigns by connecting
            your Google Ads account. Track conversions, analyze performance, and
            optimize your ad spend."
          action={{
            label: "Connect Google Ads",
            onClick: () => {
              // TODO: Open OAuth flow or settings modal
              advertisingApi.connect({
                adNetwork: "google_ads",
                accountName: "My Google Ads Account",
              });
            },
          }}
        />

        {/* Connection Options */}
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
          <Card className="border-border/60">
            <CardHeader>
              <div className="flex items-center gap-2">
                <div className="rounded-lg bg-primary/10 p-2">
                  <Globe className="h-5 w-5 text-primary" />
                </div>
                <CardTitle className="text-base">Google Ads</CardTitle>
              </div>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground mb-4">
                Connect your Google Ads account to track conversions and sync
                enhanced conversion data.
              </p>
              <Button
                variant="outline"
                className="w-full"
                onClick={() =>
                  advertisingApi.connect({
                    adNetwork: "google_ads",
                    accountName: "My Google Ads Account",
                  })
                }
              >
                Connect Google Ads
              </Button>
            </CardContent>
          </Card>

          <Card className="border-border/60">
            <CardHeader>
              <div className="flex items-center gap-2">
                <div className="rounded-lg bg-primary/10 p-2">
                  <Globe className="h-5 w-5 text-primary" />
                </div>
                <CardTitle className="text-base">Microsoft Ads</CardTitle>
              </div>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground mb-4">
                Connect Microsoft Ads to track conversions from Bing search
                campaigns.
              </p>
              <Button variant="outline" className="w-full" disabled>
                Coming Soon
              </Button>
            </CardContent>
          </Card>

          <Card className="border-border/60">
            <CardHeader>
              <div className="flex items-center gap-2">
                <div className="rounded-lg bg-primary/10 p-2">
                  <Globe className="h-5 w-5 text-primary" />
                </div>
                <CardTitle className="text-base">Facebook Ads</CardTitle>
              </div>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground mb-4">
                Track conversions from Facebook and Instagram advertising
                campaigns.
              </p>
              <Button variant="outline" className="w-full" disabled>
                Coming Soon
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  // Calculate totals from campaigns
  const totalSpend = (campaigns as any[])?.reduce((sum: number, c: any) => sum + (c.cost || 0), 0) || 0;
  const totalImpressions = (campaigns as any[])?.reduce((sum: number, c: any) => sum + (c.impressions || 0), 0) || 0;
  const totalClicks = (campaigns as any[])?.reduce((sum: number, c: any) => sum + (c.clicks || 0), 0) || 0;
  const totalConversions = (campaigns as any[])?.reduce((sum: number, c: any) => sum + (c.conversions || 0), 0) || 0;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="font-bold text-2xl text-foreground">
            Search Advertising
          </h1>
          <p className="text-muted-foreground text-sm">
            Track conversions and analyze ad performance across networks.
          </p>
        </div>
        <div className="flex gap-2">
          <Button
            variant="outline"
            leftIcon={<Settings className="h-4 w-4" />}
          >
            Settings
          </Button>
          <Button variant="primary" leftIcon={<Plus className="h-4 w-4" />}>
            New Campaign
          </Button>
        </div>
      </div>

      {/* Stats Row */}
      <div className="grid grid-cols-1 gap-4 md:grid-cols-4">
        <Metric
          title="Total Spend"
          value={formatCurrency(totalSpend)}
          icon={<DollarSign className="h-4 w-4" />}
          trend={`${(campaigns as any[])?.length || 0} campaigns`}
          color="text-warning"
        />
        <Metric
          title="Impressions"
          value={formatNumber(totalImpressions)}
          icon={<Globe className="h-4 w-4" />}
          color="text-info"
        />
        <Metric
          title="Clicks"
          value={formatNumber(totalClicks)}
          icon={<MousePointerClick className="h-4 w-4" />}
          color="text-primary"
        />
        <Metric
          title="Conversions"
          value={formatNumber(totalConversions)}
          icon={<TrendingUp className="h-4 w-4" />}
          color="text-success"
        />
      </div>

      {/* Main Content */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* Campaign Performance */}
        <Card className="border-border/60 lg:col-span-2">
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="text-base">Campaign Performance</CardTitle>
              <Button variant="ghost" size="sm">
                View All
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            {campaigns && (campaigns as any).length > 0 ? (
              <div className="space-y-3">
                {(campaigns as any).slice(0, 5).map((campaign: any, idx: number) => (
                  <div
                    key={idx}
                    className="flex items-center justify-between p-3 rounded-lg bg-muted/30"
                  >
                    <div className="flex items-center gap-3">
                      <div className="rounded-lg bg-primary/10 p-2">
                        <Search className="h-4 w-4 text-primary" />
                      </div>
                      <div>
                        <p className="text-sm font-medium">
                          {campaign.campaignName}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {formatCurrency(campaign.cost)} spend •{" "}
                          {formatNumber(campaign.impressions)} impressions
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <Badge
                        variant={
                          campaign.roas >= 3 ? "success" : campaign.roas >= 1 ? "primary" : "warning"
                        }
                      >
                        {campaign.roas.toFixed(1)}x ROAS
                      </Badge>
                      <p className="text-xs text-muted-foreground mt-1">
                        {formatNumber(campaign.conversions)} conversions
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8">
                <p className="text-sm text-muted-foreground">
                  No campaign data yet. Start by tracking conversions from your
                  ad campaigns.
                </p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Quick Stats */}
        <Card className="border-border/60">
          <CardHeader>
            <CardTitle className="text-base">Performance Overview</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Avg. CTR</span>
                <span className="font-medium">
                  {totalClicks && totalImpressions
                    ? ((totalClicks / totalImpressions) * 100).toFixed(2)
                    : "0.00"}
                  %
                </span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Avg. CPC</span>
                <span className="font-medium">
                  {totalClicks && totalSpend
                    ? formatCurrency(totalSpend / totalClicks)
                    : "$0.00"}
                </span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Conversion Rate</span>
                <span className="font-medium">
                  {totalClicks && totalConversions
                    ? ((totalConversions / totalClicks) * 100).toFixed(2)
                    : "0.00"}
                  %
                </span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Cost per Conv.</span>
                <span className="font-medium">
                  {totalConversions && totalSpend
                    ? formatCurrency(totalSpend / totalConversions)
                    : "$0.00"}
                </span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">ROAS</span>
                <span className="font-medium text-success">
                  {totalSpend && (overview as any)?.totalValue
                    ? ((overview as any).totalValue / totalSpend).toFixed(1)
                    : "0.0"}
                  x
                </span>
              </div>
            </div>

            {/* Conversion by Type */}
            {(overview as any)?.byType && (overview as any).byType.length > 0 && (
              <div className="pt-4 border-t border-border/50">
                <p className="text-xs text-muted-foreground mb-2">
                  Conversions by Type
                </p>
                <div className="space-y-2">
                  {(overview as any).byType.map((type: any) => (
                    <div
                      key={type.conversionType}
                      className="flex items-center justify-between"
                    >
                      <span className="text-sm capitalize">
                        {type.conversionType.replace("_", " ")}
                      </span>
                      <Badge variant="outline">{type.count}</Badge>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Search Engine Performance */}
      <Card className="border-border/60">
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="text-base">Ad Network Performance</CardTitle>
          </div>
        </CardHeader>
        <CardContent>
          {(overview as any)?.byNetwork && (overview as any).byNetwork.length > 0 ? (
            <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
              {(overview as any).byNetwork.map((network: any) => (
                <div
                  key={network.adNetwork}
                  className="flex items-center gap-3 p-4 rounded-lg bg-muted/30"
                >
                  <div className="rounded-lg bg-white p-2">
                    <Globe className="h-5 w-5" />
                  </div>
                  <div>
                    <p className="text-sm font-medium capitalize">
                      {network.adNetwork.replace("_", " ")}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {formatNumber(network.count)} conversions •{" "}
                      {formatCurrency(network.value)} value
                    </p>
                  </div>
                  <Badge variant="success" className="ml-auto">
                    {network.count} total
                  </Badge>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8">
              <p className="text-sm text-muted-foreground">
                No network data yet. Connect an ad account to start tracking.
              </p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
