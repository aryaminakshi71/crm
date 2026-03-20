import { Button, Card, CardContent, Badge } from "@crm/ui";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { ArrowLeft, Target, TrendingUp, Users, MessageSquare } from "lucide-react";

export const Route = createFileRoute("/app/social/competitors")({
  component: CompetitorsPage,
});

const MOCK_COMPETITORS = [
  { id: "c1", name: "CompetitorA", followers: "45K", engagement: "3.2%", mentions: 234, trend: "+5%" },
  { id: "c2", name: "CompetitorB", followers: "32K", engagement: "4.1%", mentions: 189, trend: "+8%" },
  { id: "c3", name: "CompetitorC", followers: "28K", engagement: "2.8%", mentions: 156, trend: "+3%" },
];

function CompetitorsPage() {
  const navigate = useNavigate();

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => navigate({ to: "/app/social" })}>
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div>
            <h2 className="font-bold text-xl">Competitor Monitoring</h2>
            <p className="text-muted-foreground text-sm">Track your competitors on social media</p>
          </div>
        </div>
        <Button variant="primary">Add Competitor</Button>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        {MOCK_COMPETITORS.map((comp) => (
          <Card key={comp.id} className="border-border/60">
            <CardContent className="p-6">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className="h-12 w-12 rounded-full bg-muted flex items-center justify-center">
                    <Target className="h-6 w-6 text-muted-foreground" />
                  </div>
                  <div>
                    <h3 className="font-semibold">{comp.name}</h3>
                    <Badge className="bg-green-100 text-green-800">{comp.trend}</Badge>
                  </div>
                </div>
              </div>
              <div className="grid grid-cols-3 gap-4 text-center">
                <div>
                  <p className="text-xl font-bold">{comp.followers}</p>
                  <p className="text-xs text-muted-foreground">Followers</p>
                </div>
                <div>
                  <p className="text-xl font-bold">{comp.engagement}</p>
                  <p className="text-xs text-muted-foreground">Engagement</p>
                </div>
                <div>
                  <p className="text-xl font-bold">{comp.mentions}</p>
                  <p className="text-xs text-muted-foreground">Mentions</p>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
