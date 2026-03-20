/**
 * Canned Responses
 *
 * Manage pre-written response templates.
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
  Copy,
  Edit,
  FileText,
  MessageSquare,
  Plus,
  Search,
  Tag,
  Trash2,
} from "lucide-react";
import { useState } from "react";

export const Route = createFileRoute("/app/helpdesk/canned")({
  component: CannedResponses,
});

const cannedResponses = [
  {
    id: "1",
    title: "Greeting - Standard",
    shortcut: "/greet",
    category: "Greeting",
    content: "Hi there! Thank you for contacting our support team. My name is [Agent Name] and I'll be happy to assist you today. How can I help?",
    usageCount: 1245,
    lastUsed: "2 hours ago",
  },
  {
    id: "2",
    title: "Password Reset Instructions",
    shortcut: "/pwreset",
    category: "Account",
    content: "To reset your password, please follow these steps:\n\n1. Go to our login page\n2. Click on 'Forgot Password'\n3. Enter your email address\n4. Check your inbox for the reset link\n5. Follow the link to create a new password\n\nIf you don't receive the email within 5 minutes, please check your spam folder.",
    usageCount: 892,
    lastUsed: "4 hours ago",
  },
  {
    id: "3",
    title: "Billing Inquiry - Standard",
    shortcut: "/billing",
    category: "Billing",
    content: "Thank you for reaching out regarding your billing concern. I've reviewed your account and I can see the charge in question. Let me explain the details and help resolve this for you.",
    usageCount: 567,
    lastUsed: "1 day ago",
  },
  {
    id: "4",
    title: "Feature Request Acknowledgment",
    shortcut: "/featurereq",
    category: "Feature",
    content: "Thank you for sharing this feature idea! I've documented your request and passed it along to our product team for consideration. While I can't promise a specific timeline, we truly value customer feedback in shaping our roadmap.",
    usageCount: 423,
    lastUsed: "2 days ago",
  },
  {
    id: "5",
    title: "Escalation Notice",
    shortcut: "/escalate",
    category: "Escalation",
    content: "I understand this is a critical issue for you, and I want to ensure you receive the best possible support. I'm escalating this to our senior support team who will prioritize your case and reach out within [timeframe].",
    usageCount: 234,
    lastUsed: "3 days ago",
  },
  {
    id: "6",
    title: "Closing - Issue Resolved",
    shortcut: "/close",
    category: "Closing",
    content: "I'm glad I could help resolve this issue for you today! If you have any other questions or concerns in the future, please don't hesitate to reach out. Have a great day!",
    usageCount: 1567,
    lastUsed: "1 hour ago",
  },
  {
    id: "7",
    title: "API Key Reset",
    shortcut: "/apikey",
    category: "Technical",
    content: "I've reset your API key as requested. Please note that the new key will take effect immediately. You can find your new API key in the Settings > API section of your dashboard. Please update your integrations with the new key.",
    usageCount: 345,
    lastUsed: "5 hours ago",
  },
];

const categories = ["All", "Greeting", "Account", "Billing", "Feature", "Escalation", "Closing", "Technical"];

function CannedResponses() {
  const [search, setSearch] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("All");
  const [selectedResponse, setSelectedResponse] = useState<string | null>(null);

  const filteredResponses = cannedResponses.filter((response) => {
    if (selectedCategory !== "All" && response.category !== selectedCategory) return false;
    if (!search.trim()) return true;
    return (
      response.title.toLowerCase().includes(search.toLowerCase()) ||
      response.content.toLowerCase().includes(search.toLowerCase()) ||
      response.shortcut.toLowerCase().includes(search.toLowerCase())
    );
  });

  const selected = cannedResponses.find((r) => r.id === selectedResponse);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="flex items-center gap-4">
          <Link to="/app/helpdesk">
            <Button variant="ghost" size="sm" leftIcon={<ArrowLeft className="h-4 w-4" />}>
              Back
            </Button>
          </Link>
          <div>
            <h2 className="font-bold text-xl text-foreground">Canned Responses</h2>
            <p className="text-sm text-muted-foreground">Pre-written response templates for faster replies</p>
          </div>
        </div>
        <Button variant="primary" size="sm" leftIcon={<Plus className="h-4 w-4" />}>
          New Response
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
        <StatCard title="Total Responses" value={cannedResponses.length.toString()} />
        <StatCard title="Categories" value={categories.length - 1 + ""} />
        <StatCard title="Total Usage" value="5,273" />
        <StatCard title="This Week" value="342" />
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* Response List */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <div className="flex flex-wrap items-center justify-between gap-3">
              <CardTitle className="text-sm font-bold uppercase tracking-tight text-muted-foreground">
                Responses
              </CardTitle>
              <div className="flex items-center gap-2">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                  <input
                    type="text"
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    placeholder="Search..."
                    className="h-8 rounded-lg border border-border bg-card pl-9 pr-3 text-sm w-48"
                  />
                </div>
              </div>
            </div>
            <div className="flex flex-wrap gap-2 pt-2">
              {categories.map((category) => (
                <button
                  key={category}
                  onClick={() => setSelectedCategory(category)}
                  className={`rounded-full px-3 py-1 text-xs font-medium transition-colors ${
                    selectedCategory === category
                      ? "bg-primary text-primary-foreground"
                      : "bg-muted text-muted-foreground hover:text-foreground"
                  }`}
                >
                  {category}
                </button>
              ))}
            </div>
          </CardHeader>
          <CardContent className="space-y-2">
            {filteredResponses.map((response) => (
              <button
                key={response.id}
                onClick={() => setSelectedResponse(response.id)}
                className={`w-full rounded-lg border p-3 text-left transition-colors ${
                  selectedResponse === response.id ? "border-primary bg-primary/5" : "border-border hover:border-primary/50"
                }`}
              >
                <div className="flex items-center justify-between">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-medium text-sm">{response.title}</span>
                      <Badge variant="outline" className="text-xs">{response.shortcut}</Badge>
                    </div>
                    <p className="mt-1 text-xs text-muted-foreground line-clamp-1">{response.content}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-muted-foreground">{response.usageCount} uses</span>
                  </div>
                </div>
              </button>
            ))}
          </CardContent>
        </Card>

        {/* Response Preview */}
        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-bold uppercase tracking-tight text-muted-foreground">
              Preview
            </CardTitle>
          </CardHeader>
          <CardContent>
            {selected ? (
              <div className="space-y-4">
                <div>
                  <div className="flex items-center gap-2 mb-2">
                    <h3 className="font-semibold">{selected.title}</h3>
                    <Badge variant="outline">{selected.shortcut}</Badge>
                  </div>
                  <div className="flex items-center gap-2 text-xs text-muted-foreground">
                    <Tag className="h-3 w-3" />
                    {selected.category}
                    <span className="mx-1">-</span>
                    <span>Used {selected.usageCount} times</span>
                  </div>
                </div>
                <div className="rounded-lg bg-muted/50 p-3">
                  <p className="whitespace-pre-wrap text-sm">{selected.content}</p>
                </div>
                <div className="flex items-center gap-2">
                  <Button variant="outline" size="sm" className="flex-1" leftIcon={<Copy className="h-4 w-4" />}>
                    Copy
                  </Button>
                  <Button variant="outline" size="sm" leftIcon={<Edit className="h-4 w-4" />}>
                    Edit
                  </Button>
                  <Button variant="ghost" size="sm">
                    <Trash2 className="h-4 w-4 text-rose-400" />
                  </Button>
                </div>
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center py-12 text-center">
                <MessageSquare className="h-12 w-12 text-muted-foreground mb-4" />
                <p className="text-sm text-muted-foreground">Select a response to preview</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

function StatCard({ title, value }: { title: string; value: string }) {
  return (
    <Card className="border-border/60">
      <CardContent className="p-4 text-center">
        <p className="text-muted-foreground text-[10px] font-black uppercase tracking-widest">{title}</p>
        <p className="font-black text-2xl text-foreground mt-0.5">{value}</p>
      </CardContent>
    </Card>
  );
}
