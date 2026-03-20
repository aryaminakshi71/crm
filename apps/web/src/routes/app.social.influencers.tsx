import { Button, Card, CardContent, Badge, Input } from "@crm/ui";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { ArrowLeft, Users, Search, MessageSquare, UserPlus, Star } from "lucide-react";
import { useState } from "react";

export const Route = createFileRoute("/app/social/influencers")({
  component: InfluencersPage,
});

interface Influencer {
  id: string;
  name: string;
  handle: string;
  platform: string;
  followers: string;
  engagement: string;
  category: string;
  score: number;
}

const MOCK_INFLUENCERS: Influencer[] = [
  { id: "i1", name: "Sarah Tech", handle: "@sahtech", platform: "twitter", followers: "125K", engagement: "5.2%", category: "Tech", score: 92 },
  { id: "i2", name: "Startup Daily", handle: "@startupdaily", platform: "linkedin", followers: "89K", engagement: "4.8%", category: "Business", score: 88 },
  { id: "i3", name: "Code Master", handle: "@codemaster", platform: "twitter", followers: "67K", engagement: "6.1%", category: "Development", score: 95 },
];

function InfluencersPage() {
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState("");

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => navigate({ to: "/app/social" })}>
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div>
            <h2 className="font-bold text-xl">Influencer Identification</h2>
            <p className="text-muted-foreground text-sm">Find and connect with influencers</p>
          </div>
        </div>
        <Button variant="primary" leftIcon={<UserPlus className="h-4 w-4" />}>
          Add Influencer
        </Button>
      </div>

      <div className="relative max-w-md">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <input
          type="text"
          placeholder="Search influencers..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full pl-10 pr-4 py-2 border rounded-lg bg-background text-sm"
        />
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {MOCK_INFLUENCERS.map((influencer) => (
          <Card key={influencer.id} className="border-border/60">
            <CardContent className="p-4">
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center">
                    <Users className="h-6 w-6 text-primary" />
                  </div>
                  <div>
                    <h3 className="font-semibold">{influencer.name}</h3>
                    <p className="text-sm text-muted-foreground">{influencer.handle}</p>
                  </div>
                </div>
                <Badge className="bg-amber-100 text-amber-800">{influencer.score}</Badge>
              </div>
              <div className="flex items-center justify-between mb-4">
                <Badge variant="outline">{influencer.platform}</Badge>
                <span className="text-sm text-muted-foreground">{influencer.category}</span>
              </div>
              <div className="grid grid-cols-2 gap-4 text-center mb-4">
                <div>
                  <p className="text-lg font-bold">{influencer.followers}</p>
                  <p className="text-xs text-muted-foreground">Followers</p>
                </div>
                <div>
                  <p className="text-lg font-bold">{influencer.engagement}</p>
                  <p className="text-xs text-muted-foreground">Engagement</p>
                </div>
              </div>
              <Button variant="outline" className="w-full" leftIcon={<MessageSquare className="h-4 w-4" />}>
                Contact
              </Button>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
