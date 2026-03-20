import { Button, Card, CardContent, Badge, Input } from "@crm/ui";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import {
  ArrowLeft,
  MessageSquare,
  Plus,
  Search,
  Edit,
  Trash2,
  Copy,
  Clock,
  FileText,
} from "lucide-react";
import { useState } from "react";

export const Route = createFileRoute("/app/communications/templates")({
  component: TemplatesPage,
});

interface Template {
  id: string;
  name: string;
  content: string;
  category: string;
  variables: string[];
  usageCount: number;
  lastUsed: string;
}

const MOCK_TEMPLATES: Template[] = [
  { id: "t1", name: "Welcome Message", content: "Welcome to {company_name}! We're excited to have you.", category: "Greeting", variables: ["company_name"], usageCount: 1247, lastUsed: "2 hours ago" },
  { id: "t2", name: "Order Confirmation", content: "Your order #{order_id} has been confirmed. We'll notify you when it ships.", category: "Order", variables: ["order_id"], usageCount: 892, lastUsed: "1 hour ago" },
  { id: "t3", name: "Appointment Reminder", content: "Hi {name}, this is a reminder about your appointment on {date} at {time}.", category: "Reminder", variables: ["name", "date", "time"], usageCount: 456, lastUsed: "30 min ago" },
  { id: "t4", name: "Support Response", content: "Thank you for contacting support. A member of our team will respond within {response_time}.", category: "Support", variables: ["response_time"], usageCount: 789, lastUsed: "15 min ago" },
  { id: "t5", name: "Promotional Offer", content: "Hi {name}! Use code {code} to get {discount}% off your next purchase.", category: "Marketing", variables: ["name", "code", "discount"], usageCount: 234, lastUsed: "3 days ago" },
  { id: "t6", name: "Shipping Update", content: "Your order #{order_id} has been shipped! Track at: {tracking_url}", category: "Order", variables: ["order_id", "tracking_url"], usageCount: 567, lastUsed: "45 min ago" },
];

const CATEGORIES = ["All", "Greeting", "Order", "Reminder", "Support", "Marketing"];

function TemplatesPage() {
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("All");

  const filteredTemplates = MOCK_TEMPLATES.filter((template) => {
    const matchesSearch = template.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      template.content.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = selectedCategory === "All" || template.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => navigate({ to: "/app/communications" })}>
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div>
            <h2 className="font-bold text-xl">Message Templates</h2>
            <p className="text-muted-foreground text-sm">Create and manage reusable message templates</p>
          </div>
        </div>
        <Button variant="primary" leftIcon={<Plus className="h-4 w-4" />}>
          Create Template
        </Button>
      </div>

      {/* Stats */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card className="border-border/60">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-100">
                <FileText className="h-5 w-5 text-blue-600" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Total Templates</p>
                <p className="text-xl font-bold">{MOCK_TEMPLATES.length}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="border-border/60">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-green-100">
                <MessageSquare className="h-5 w-5 text-green-600" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Total Usage</p>
                <p className="text-xl font-bold">{MOCK_TEMPLATES.reduce((sum, t) => sum + t.usageCount, 0).toLocaleString()}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="border-border/60">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-purple-100">
                <Clock className="h-5 w-5 text-purple-600" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Most Used</p>
                <p className="text-xl font-bold">Welcome</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="border-border/60">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-amber-100">
                <MessageSquare className="h-5 w-5 text-amber-600" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Categories</p>
                <p className="text-xl font-bold">{CATEGORIES.length - 1}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Search and Filter */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <input
            type="text"
            placeholder="Search templates..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border rounded-lg bg-background text-sm"
          />
        </div>
        <div className="flex gap-2 overflow-x-auto">
          {CATEGORIES.map((category) => (
            <Button
              key={category}
              variant={selectedCategory === category ? "primary" : "outline"}
              size="sm"
              onClick={() => setSelectedCategory(category)}
            >
              {category}
            </Button>
          ))}
        </div>
      </div>

      {/* Templates Grid */}
      <div className="grid gap-4 md:grid-cols-2">
        {filteredTemplates.map((template) => (
          <Card key={template.id} className="border-border/60 hover:border-primary/50 transition-colors">
            <CardContent className="p-4">
              <div className="flex items-start justify-between mb-3">
                <div>
                  <h3 className="font-semibold">{template.name}</h3>
                  <Badge variant="outline" className="mt-1">{template.category}</Badge>
                </div>
                <div className="flex gap-1">
                  <Button variant="ghost" size="icon" className="h-8 w-8">
                    <Edit className="h-4 w-4" />
                  </Button>
                  <Button variant="ghost" size="icon" className="h-8 w-8">
                    <Copy className="h-4 w-4" />
                  </Button>
                  <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive">
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>

              <p className="text-sm text-muted-foreground mb-4 line-clamp-2">{template.content}</p>

              <div className="flex flex-wrap gap-1 mb-4">
                {template.variables.map((v) => (
                  <span key={v} className="px-2 py-0.5 bg-primary/10 text-primary rounded text-xs font-mono">
                    {`{${v}}`}
                  </span>
                ))}
              </div>

              <div className="flex items-center justify-between text-xs text-muted-foreground">
                <span>Used {template.usageCount.toLocaleString()} times</span>
                <span>Last: {template.lastUsed}</span>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
