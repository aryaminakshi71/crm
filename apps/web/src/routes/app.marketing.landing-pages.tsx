/**
 * Landing Page Builder
 *
 * Squeeze page and landing page builder with templates.
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
  BarChart3,
  Eye,
  Globe,
  GripVertical,
  Image,
  Layout,
  LayoutTemplate,
  Link2,
  Monitor,
  Plus,
  Save,
  Settings,
  Smartphone,
  Square,
  Trash2,
  Type,
  Video,
} from "lucide-react";
import { useState } from "react";

export const Route = createFileRoute("/app/marketing/landing-pages")({
  component: LandingPageBuilder,
});

const landingPageTemplates = [
  { id: "1", name: "Lead Magnet", description: "Capture leads with a free resource", category: "lead-generation", preview: "lead-magnet" },
  { id: "2", name: "Webinar Registration", description: "Register attendees for your webinar", category: "events", preview: "webinar" },
  { id: "3", name: "Product Showcase", description: "Highlight your product features", category: "product", preview: "product" },
  { id: "4", name: "Coming Soon", description: "Build anticipation for a launch", category: "pre-launch", preview: "coming-soon" },
  { id: "5", name: "Contest Entry", description: "Run a giveaway or contest", category: "engagement", preview: "contest" },
  { id: "6", name: "Newsletter Signup", description: "Grow your email list", category: "lead-generation", preview: "newsletter" },
];

const pageElements = [
  { id: "hero", name: "Hero Section", icon: Layout },
  { id: "headline", name: "Headline", icon: Type },
  { id: "subheadline", name: "Subheadline", icon: Type },
  { id: "image", name: "Image", icon: Image },
  { id: "video", name: "Video Embed", icon: Video },
  { id: "form", name: "Lead Form", icon: Square },
  { id: "button", name: "CTA Button", icon: Square },
  { id: "features", name: "Features Grid", icon: Layout },
  { id: "testimonial", name: "Testimonial", icon: Layout },
  { id: "footer", name: "Footer", icon: Layout },
];

function LandingPageBuilder() {
  const [activeTemplate, setActiveTemplate] = useState<string | null>(null);
  const [previewMode, setPreviewMode] = useState<"desktop" | "mobile">("desktop");
  const [pageName, setPageName] = useState("Spring Sale Landing Page");
  const [pageUrl, setPageUrl] = useState("spring-sale-2026");

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="flex items-center gap-4">
          <Link to="/app/marketing">
            <Button variant="ghost" size="sm" leftIcon={<ArrowLeft className="h-4 w-4" />}>
              Back
            </Button>
          </Link>
          <div>
            <h2 className="font-bold text-xl text-foreground">Landing Page Builder</h2>
            <p className="text-sm text-muted-foreground">Create squeeze pages and landing pages</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" leftIcon={<Eye className="h-4 w-4" />}>
            Preview
          </Button>
          <Button variant="outline" size="sm" leftIcon={<Globe className="h-4 w-4" />}>
            Publish Settings
          </Button>
          <Button variant="primary" size="sm" leftIcon={<Save className="h-4 w-4" />}>
            Save Page
          </Button>
        </div>
      </div>

      {/* Page Settings */}
      <Card>
        <CardContent className="p-4">
          <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
            <div>
              <label className="mb-1 block text-xs font-medium text-muted-foreground">Page Name</label>
              <input
                type="text"
                value={pageName}
                onChange={(e) => setPageName(e.target.value)}
                className="flex h-10 w-full rounded-lg border border-border bg-card px-3 py-2 text-sm"
              />
            </div>
            <div>
              <label className="mb-1 block text-xs font-medium text-muted-foreground">URL Slug</label>
              <div className="flex items-center">
                <span className="flex h-10 items-center rounded-l-lg border border-r-0 border-border bg-muted px-3 text-sm text-muted-foreground">
                  nucleo.one/
                </span>
                <input
                  type="text"
                  value={pageUrl}
                  onChange={(e) => setPageUrl(e.target.value)}
                  className="flex h-10 flex-1 rounded-r-lg border border-border bg-card px-3 py-2 text-sm"
                />
              </div>
            </div>
            <div>
              <label className="mb-1 block text-xs font-medium text-muted-foreground">Status</label>
              <div className="flex items-center gap-2">
                <Badge variant="outline">Draft</Badge>
                <Button variant="ghost" size="sm">Publish</Button>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Builder Interface */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-4">
        {/* Left Sidebar - Templates & Elements */}
        <Card className="lg:col-span-1">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-bold uppercase tracking-tight text-muted-foreground">
              Templates
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {landingPageTemplates.map((template) => (
              <button
                key={template.id}
                onClick={() => setActiveTemplate(template.id)}
                className={`w-full rounded-lg border p-3 text-left transition-colors ${
                  activeTemplate === template.id
                    ? "border-primary bg-primary/5"
                    : "border-border hover:border-primary/50"
                }`}
              >
                <div className="flex items-center gap-2 mb-1">
                  <LayoutTemplate className="h-4 w-4 text-primary" />
                  <span className="text-sm font-medium">{template.name}</span>
                </div>
                <p className="text-[10px] text-muted-foreground">{template.description}</p>
              </button>
            ))}
          </CardContent>

          <CardHeader className="pb-2 pt-4">
            <CardTitle className="text-sm font-bold uppercase tracking-tight text-muted-foreground">
              Elements
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-1">
            {pageElements.map((element) => {
              const Icon = element.icon;
              return (
                <div
                  key={element.id}
                  draggable
                  className="flex cursor-grab items-center gap-2 rounded-lg p-2 text-sm hover:bg-muted"
                >
                  <GripVertical className="h-4 w-4 text-muted-foreground" />
                  <Icon className="h-4 w-4" />
                  {element.name}
                </div>
              );
            })}
          </CardContent>
        </Card>

        {/* Center - Page Canvas */}
        <Card className="lg:col-span-3">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-bold uppercase tracking-tight text-muted-foreground">
              Page Preview
            </CardTitle>
            <div className="flex items-center gap-2">
              <div className="flex items-center gap-1 rounded-lg border border-border p-1">
                <button
                  onClick={() => setPreviewMode("desktop")}
                  className={`rounded p-1 ${previewMode === "desktop" ? "bg-muted" : ""}`}
                >
                  <Monitor className="h-4 w-4" />
                </button>
                <button
                  onClick={() => setPreviewMode("mobile")}
                  className={`rounded p-1 ${previewMode === "mobile" ? "bg-muted" : ""}`}
                >
                  <Smartphone className="h-4 w-4" />
                </button>
              </div>
              <Button variant="ghost" size="sm" leftIcon={<Eye className="h-4 w-4" />}>
                Full Preview
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <div
              className={`mx-auto bg-white transition-all ${
                previewMode === "mobile" ? "w-[375px] rounded-lg border border-border" : ""
              }`}
            >
              {/* Hero Section */}
              <div className="relative bg-gradient-to-br from-primary via-violet-600 to-primary min-h-[400px] flex items-center justify-center p-8">
                <div className="text-center">
                  <Badge variant="secondary" className="mb-4 bg-white/20 text-white border-0">
                    Limited Time Offer
                  </Badge>
                  <h1 className="text-4xl font-bold text-white mb-4">
                    Spring Sale 2026
                  </h1>
                  <p className="text-xl text-white/80 mb-8 max-w-md mx-auto">
                    Get up to 50% off on all premium plans. Don't miss out!
                  </p>
                  <div className="flex justify-center gap-4">
                    <button className="rounded-lg bg-white px-8 py-4 text-primary font-semibold hover:bg-white/90 transition-colors">
                      Get Started Now
                    </button>
                  </div>
                </div>
              </div>

              {/* Features Section */}
              <div className="bg-gray-50 p-8">
                <h2 className="text-2xl font-bold text-gray-900 text-center mb-8">
                  Why Choose Us?
                </h2>
                <div className="grid grid-cols-3 gap-6">
                  <div className="text-center">
                    <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-3">
                      <BarChart3 className="h-6 w-6 text-primary" />
                    </div>
                    <h3 className="font-semibold text-gray-900 mb-1">Analytics</h3>
                    <p className="text-sm text-gray-600">Track every click and conversion</p>
                  </div>
                  <div className="text-center">
                    <div className="h-12 w-12 rounded-full bg-violet-500/10 flex items-center justify-center mx-auto mb-3">
                      <Globe className="h-6 w-6 text-violet-500" />
                    </div>
                    <h3 className="font-semibold text-gray-900 mb-1">Global</h3>
                    <p className="text-sm text-gray-600">Reach customers worldwide</p>
                  </div>
                  <div className="text-center">
                    <div className="h-12 w-12 rounded-full bg-emerald-500/10 flex items-center justify-center mx-auto mb-3">
                      <Link2 className="h-6 w-6 text-emerald-500" />
                    </div>
                    <h3 className="font-semibold text-gray-900 mb-1">Integrations</h3>
                    <p className="text-sm text-gray-600">Connect with 100+ tools</p>
                  </div>
                </div>
              </div>

              {/* CTA Section */}
              <div className="bg-white p-8 text-center border-t border-gray-200">
                <h2 className="text-2xl font-bold text-gray-900 mb-4">
                  Ready to Get Started?
                </h2>
                <p className="text-gray-600 mb-6 max-w-md mx-auto">
                  Join thousands of satisfied customers today.
                </p>
                <button className="rounded-lg bg-primary px-8 py-4 text-white font-semibold hover:bg-primary/90 transition-colors">
                  Start Free Trial
                </button>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
