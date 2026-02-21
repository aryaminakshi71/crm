/**
 * Marketing Route
 *
 * Marketing campaigns and automation.
 */

import {
  Badge,
  Button,
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  FormField,
  FormModal,
  Input,
  Textarea,
} from "@crm/ui";
import { createFileRoute } from "@tanstack/react-router";
import {
  BarChart3,
  Calendar,
  Eye,
  Mail,
  MousePointerClick,
  Plus,
  Send,
  TrendingUp,
  Users,
} from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

export const Route = createFileRoute("/app/marketing")({
  component: MarketingPage,
});

const initialCampaigns = [
  {
    id: 1,
    name: "Q1 Product Launch",
    status: "active",
    recipients: 1250,
    opened: 892,
    clicked: 234,
    sent: "2024-01-10",
  },
  {
    id: 2,
    name: "Welcome Series",
    status: "active",
    recipients: 856,
    opened: 623,
    clicked: 145,
    sent: "2024-01-08",
  },
  {
    id: 3,
    name: "Holiday Promotion",
    status: "completed",
    recipients: 2100,
    opened: 1680,
    clicked: 420,
    sent: "2023-12-15",
  },
];

function MarketingPage() {
  const [campaigns, setCampaigns] = useState(initialCampaigns);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [newCampaign, setNewCampaign] = useState({
    name: "",
    subject: "",
    content: "",
    recipients: "all",
  });

  const stats = [
    {
      label: "Total Campaigns",
      value: campaigns.length.toString(),
      icon: Mail,
      change: "+3 this month",
    },
    {
      label: "Active Campaigns",
      value: campaigns.filter((c) => c.status === "active").length.toString(),
      icon: Send,
      change: "2 scheduled",
    },
    {
      label: "Total Recipients",
      value: campaigns
        .reduce((sum, c) => sum + c.recipients, 0)
        .toLocaleString(),
      icon: Users,
      change: "+12% vs last month",
    },
    {
      label: "Avg. Open Rate",
      value: `${Math.round((campaigns.reduce((sum, c) => sum + c.opened, 0) / campaigns.reduce((sum, c) => sum + c.recipients, 0)) * 100)}%`,
      icon: TrendingUp,
      change: "+5% improvement",
    },
  ];

  const handleCreateCampaign = () => {
    if (!newCampaign.name.trim()) {
      toast.error("Campaign name is required");
      return;
    }
    if (!newCampaign.subject.trim()) {
      toast.error("Email subject is required");
      return;
    }

    const campaign = {
      id: Date.now(),
      name: newCampaign.name,
      status: "draft" as const,
      recipients: 0,
      opened: 0,
      clicked: 0,
      sent: new Date().toISOString().split("T")[0],
    };

    setCampaigns([campaign, ...campaigns]);
    toast.success("Campaign created successfully");
    setIsModalOpen(false);
    setNewCampaign({ name: "", subject: "", content: "", recipients: "all" });
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-bold text-2xl text-foreground">Marketing</h1>
          <p className="text-muted-foreground">
            Manage your marketing campaigns and automation
          </p>
        </div>
        <Button
          variant="primary"
          leftIcon={<Plus className="h-4 w-4" />}
          onClick={() => setIsModalOpen(true)}
        >
          Create Campaign
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-4">
        {stats.map((stat) => (
          <Card key={stat.label}>
            <CardContent className="p-6">
              <div className="mb-4 flex items-center justify-between">
                <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10">
                  <stat.icon className="h-6 w-6 text-primary" />
                </div>
              </div>
              <div className="mb-1 font-bold text-2xl text-foreground">
                {stat.value}
              </div>
              <div className="mb-1 text-muted-foreground text-sm">
                {stat.label}
              </div>
              <div className="text-success text-xs">{stat.change}</div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Recent Campaigns */}
      <Card>
        <CardHeader>
          <CardTitle>Recent Campaigns</CardTitle>
          <CardDescription>
            View and manage your email marketing campaigns
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {campaigns.map((campaign) => (
              <div
                key={campaign.id}
                className="flex items-center justify-between rounded-lg border border-border p-4 transition hover:bg-muted"
              >
                <div className="flex-1">
                  <div className="mb-2 flex items-center gap-3">
                    <h3 className="font-semibold text-foreground">
                      {campaign.name}
                    </h3>
                    <Badge
                      variant={
                        campaign.status === "active"
                          ? "default"
                          : campaign.status === "draft"
                            ? "outline"
                            : "outline"
                      }
                      className={
                        campaign.status === "active"
                          ? "bg-success/15 text-success"
                          : ""
                      }
                    >
                      {campaign.status}
                    </Badge>
                  </div>
                  <div className="grid grid-cols-4 gap-4 text-muted-foreground text-sm">
                    <div className="flex items-center gap-1">
                      <Users className="h-4 w-4 text-muted-foreground" />
                      <span className="font-medium text-foreground">
                        {campaign.recipients}
                      </span>{" "}
                      recipients
                    </div>
                    <div className="flex items-center gap-1">
                      <Eye className="h-4 w-4 text-muted-foreground" />
                      <span className="font-medium text-foreground">
                        {campaign.opened}
                      </span>{" "}
                      opened
                    </div>
                    <div className="flex items-center gap-1">
                      <MousePointerClick className="h-4 w-4 text-muted-foreground" />
                      <span className="font-medium text-foreground">
                        {campaign.clicked}
                      </span>{" "}
                      clicked
                    </div>
                    <div className="flex items-center gap-1">
                      <Calendar className="h-4 w-4 text-muted-foreground" />
                      {campaign.sent}
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Button variant="outline" size="sm">
                    View
                  </Button>
                  <Button variant="outline" size="sm">
                    Edit
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
        <Card
          className="cursor-pointer transition hover:shadow-lg"
          onClick={() => toast.info("Email Templates coming soon!")}
        >
          <CardContent className="p-6">
            <div className="flex items-center gap-4">
              <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10">
                <Mail className="h-6 w-6 text-primary" />
              </div>
              <div>
                <h3 className="mb-1 font-semibold text-foreground">
                  Email Templates
                </h3>
                <p className="text-muted-foreground text-sm">
                  Create and manage email templates
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card
          className="cursor-pointer transition hover:shadow-lg"
          onClick={() => toast.info("Analytics coming soon!")}
        >
          <CardContent className="p-6">
            <div className="flex items-center gap-4">
              <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10">
                <BarChart3 className="h-6 w-6 text-primary" />
              </div>
              <div>
                <h3 className="mb-1 font-semibold text-foreground">
                  Analytics
                </h3>
                <p className="text-muted-foreground text-sm">
                  View campaign performance metrics
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card
          className="cursor-pointer transition hover:shadow-lg"
          onClick={() => toast.info("Segments coming soon!")}
        >
          <CardContent className="p-6">
            <div className="flex items-center gap-4">
              <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10">
                <Users className="h-6 w-6 text-primary" />
              </div>
              <div>
                <h3 className="mb-1 font-semibold text-foreground">Segments</h3>
                <p className="text-muted-foreground text-sm">
                  Create targeted audience segments
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Create Campaign Modal */}
      <FormModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSubmit={handleCreateCampaign}
        title="Create Campaign"
        submitText="Create Campaign"
      >
        <div className="space-y-4">
          <FormField label="Campaign Name" required>
            <Input
              value={newCampaign.name}
              onChange={(e) =>
                setNewCampaign({ ...newCampaign, name: e.target.value })
              }
              placeholder="e.g., Spring Sale Announcement"
              required
            />
          </FormField>
          <FormField label="Email Subject" required>
            <Input
              value={newCampaign.subject}
              onChange={(e) =>
                setNewCampaign({ ...newCampaign, subject: e.target.value })
              }
              placeholder="e.g., Don't miss our biggest sale of the year!"
              required
            />
          </FormField>
          <FormField label="Recipients" required>
            <select
              className="flex h-10 w-full rounded-lg border border-border bg-card px-3 py-2 text-sm"
              value={newCampaign.recipients}
              onChange={(e) =>
                setNewCampaign({ ...newCampaign, recipients: e.target.value })
              }
            >
              <option value="all">All Contacts</option>
              <option value="leads">Leads Only</option>
              <option value="customers">Customers Only</option>
              <option value="inactive">Inactive Users</option>
            </select>
          </FormField>
          <FormField label="Email Content" required>
            <Textarea
              value={newCampaign.content}
              onChange={(e) =>
                setNewCampaign({ ...newCampaign, content: e.target.value })
              }
              placeholder="Write your email content here..."
              rows={6}
              required
            />
          </FormField>
        </div>
      </FormModal>
    </div>
  );
}
