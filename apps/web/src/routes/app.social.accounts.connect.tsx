import { Button, Card, CardContent, Input } from "@crm/ui";
import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import {
  ArrowLeft,
  Instagram,
  Twitter,
  Linkedin,
  Facebook,
  Youtube,
  ExternalLink,
  CheckCircle,
} from "lucide-react";
import { useState } from "react";

export const Route = createFileRoute("/app/social/accounts/connect")({
  component: ConnectAccountPage,
});

const PLATFORMS = [
  { name: "Instagram", icon: Instagram, color: "bg-pink-500", description: "Connect your Instagram Business account" },
  { name: "Twitter", icon: Twitter, color: "bg-sky-500", description: "Connect your Twitter/X account" },
  { name: "LinkedIn", icon: Linkedin, color: "bg-blue-600", description: "Connect your LinkedIn Company Page" },
  { name: "Facebook", icon: Facebook, color: "bg-blue-500", description: "Connect your Facebook Page" },
  { name: "YouTube", icon: Youtube, color: "bg-red-500", description: "Connect your YouTube channel" },
];

function ConnectAccountPage() {
  const navigate = useNavigate();
  const [connectedPlatform, setConnectedPlatform] = useState<string | null>(null);

  const handleConnect = async (platform: string) => {
    setConnectedPlatform(platform);
    // In a real app, this would initiate OAuth flow
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => navigate({ to: "/app/social/accounts" })}>
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div>
            <h2 className="font-bold text-xl">Connect Account</h2>
            <p className="text-muted-foreground text-sm">Link your social media accounts</p>
          </div>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {PLATFORMS.map((platform) => {
          const Icon = platform.icon;
          const isConnected = connectedPlatform === platform.name;
          return (
            <Card key={platform.name} className="border-border/60 hover:border-primary/50 transition-colors">
              <CardContent className="p-6">
                <div className="flex flex-col items-center text-center">
                  <div className={`h-16 w-16 rounded-full ${platform.color} flex items-center justify-center mb-4`}>
                    <Icon className="h-8 w-8 text-white" />
                  </div>
                  <h3 className="font-semibold mb-2">{platform.name}</h3>
                  <p className="text-sm text-muted-foreground mb-4">{platform.description}</p>
                  {isConnected ? (
                    <div className="flex items-center gap-2 text-green-600">
                      <CheckCircle className="h-5 w-5" />
                      <span className="font-medium">Connected</span>
                    </div>
                  ) : (
                    <Button
                      variant="outline"
                      onClick={() => handleConnect(platform.name)}
                      leftIcon={<ExternalLink className="h-4 w-4" />}
                    >
                      Connect
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
