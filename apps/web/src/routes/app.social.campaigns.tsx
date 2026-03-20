import { Button, Card, CardContent, Badge } from "@crm/ui";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { ArrowLeft, Target, Plus, Calendar, Users, TrendingUp, Play, Pause } from "lucide-react";

export const Route = createFileRoute("/app/social/campaigns")({
  component: CampaignsPage,
});

interface Campaign {
  id: string;
  name: string;
  status: "active" | "paused" | "completed" | "draft";
  startDate: string;
  endDate: string;
  reach: string;
  engagement: string;
  budget: string;
}

const MOCK_CAMPAIGNS: Campaign[] = [
  { id: "c1", name: "Spring Product Launch", status: "active", startDate: "Mar 1, 2024", endDate: "Mar 31, 2024", reach: "125K", engagement: "4.8%", budget: "$5,000" },
  { id: "c2", name: "Brand Awareness Q1", status: "active", startDate: "Jan 1, 2024", endDate: "Mar 31, 2024", reach: "450K", engagement: "3.2%", budget: "$12,000" },
  { id: "c3", name: "Summer Sale Promo", status: "draft", startDate: "Jun 1, 2024", endDate: "Aug 31, 2024", reach: "-", engagement: "-", budget: "$8,000" },
  { id: "c4", name: "Holiday Campaign", status: "completed", startDate: "Dec 1, 2023", endDate: "Dec 31, 2023", reach: "890K", engagement: "5.1%", budget: "$15,000" },
];

function CampaignsPage() {
  const navigate = useNavigate();

  const getStatusBadge = (status: Campaign["status"]) => {
    switch (status) {
      case "active": return <Badge className="bg-green-100 text-green-800">Active</Badge>;
      case "paused": return <Badge className="bg-amber-100 text-amber-800">Paused</Badge>;
      case "completed": return <Badge variant="outline">Completed</Badge>;
      case "draft": return <Badge variant="outline">Draft</Badge>;
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => navigate({ to: "/app/social" })}>
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div>
            <h2 className="font-bold text-xl">Campaign Management</h2>
            <p className="text-muted-foreground text-sm">Create and manage social media campaigns</p>
          </div>
        </div>
        <Button variant="primary" leftIcon={<Plus className="h-4 w-4" />}>
          Create Campaign
        </Button>
      </div>

      <div className="grid gap-4 md:grid-cols-4">
        <Card className="border-border/60">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-100">
                <Target className="h-5 w-5 text-blue-600" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Active Campaigns</p>
                <p className="text-xl font-bold">{MOCK_CAMPAIGNS.filter((c) => c.status === "active").length}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="border-border/60">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-purple-100">
                <Users className="h-5 w-5 text-purple-600" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Total Reach</p>
                <p className="text-xl font-bold">1.4M</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="border-border/60">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-green-100">
                <TrendingUp className="h-5 w-5 text-green-600" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Avg Engagement</p>
                <p className="text-xl font-bold">4.4%</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="border-border/60">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-amber-100">
                <Calendar className="h-5 w-5 text-amber-600" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Total Budget</p>
                <p className="text-xl font-bold">$40K</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card className="border-border/60">
        <CardContent className="p-0">
          <div className="divide-y divide-border">
            {MOCK_CAMPAIGNS.map((campaign) => (
              <div key={campaign.id} className="p-4 hover:bg-muted/50 transition-colors">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-3">
                    <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center">
                      <Target className="h-5 w-5 text-primary" />
                    </div>
                    <div>
                      <h3 className="font-semibold">{campaign.name}</h3>
                      <p className="text-sm text-muted-foreground">{campaign.startDate} - {campaign.endDate}</p>
                    </div>
                  </div>
                  {getStatusBadge(campaign.status)}
                </div>
                <div className="grid grid-cols-4 gap-4 text-center">
                  <div>
                    <p className="text-sm font-medium">{campaign.reach}</p>
                    <p className="text-xs text-muted-foreground">Reach</p>
                  </div>
                  <div>
                    <p className="text-sm font-medium">{campaign.engagement}</p>
                    <p className="text-xs text-muted-foreground">Engagement</p>
                  </div>
                  <div>
                    <p className="text-sm font-medium">{campaign.budget}</p>
                    <p className="text-xs text-muted-foreground">Budget</p>
                  </div>
                  <div className="flex justify-center gap-2">
                    {campaign.status === "active" ? (
                      <Button variant="outline" size="sm" leftIcon={<Pause className="h-3 w-3" />}>
                        Pause
                      </Button>
                    ) : campaign.status === "paused" ? (
                      <Button variant="outline" size="sm" leftIcon={<Play className="h-3 w-3" />}>
                        Resume
                      </Button>
                    ) : (
                      <Button variant="outline" size="sm">
                        View
                      </Button>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
