/**
 * Help Center Builder
 *
 * Customize and manage your customer help center.
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
  BookOpenText,
  Edit,
  Eye,
  Globe,
  HelpCircle,
  Layout,
  LifeBuoy,
  MessageSquare,
  Monitor,
  Plus,
  Search,
  Settings,
  Smartphone,
  StickyNote,
  TestTube,
  Wrench,
} from "lucide-react";
import { useState } from "react";

export const Route = createFileRoute("/app/helpdesk/help-center")({
  component: HelpCenterBuilder,
});

const customizationOptions = [
  { id: "name", label: "Help Center Name", value: "Nucleo One Help Center" },
  { id: "tagline", label: "Tagline", value: "Get help and support for Nucleo One" },
  { id: "logo", label: "Logo", value: "Default Logo" },
  { id: "primaryColor", label: "Primary Color", value: "#22d3ee" },
  { id: "accentColor", label: "Accent Color", value: "#a78bfa" },
];

const appearanceSettings = [
  { id: "layout", label: "Layout Style", options: ["Classic", "Modern", "Compact"] },
  { id: "sidebar", label: "Sidebar Position", options: ["Left", "Right", "Hidden"] },
  { id: "search", label: "Search Bar", options: ["Top", "Bottom", "Hidden"] },
  { id: "feedback", label: "Feedback Buttons", options: ["Yes", "No"] },
];

const sections = [
  { id: "1", name: "Getting Started", icon: BookOpenText, articles: 12, order: 1, enabled: true },
  { id: "2", name: "Account & Billing", icon: MessageSquare, articles: 8, order: 2, enabled: true },
  { id: "3", name: "Features & Usage", icon: LifeBuoy, articles: 24, order: 3, enabled: true },
  { id: "4", name: "Integrations", icon: Wrench, articles: 15, order: 4, enabled: true },
  { id: "5", name: "Troubleshooting", icon: HelpCircle, articles: 18, order: 5, enabled: true },
  { id: "6", name: "FAQs", icon: StickyNote, articles: 10, order: 6, enabled: false },
];

function HelpCenterBuilder() {
  const [activeTab, setActiveTab] = useState<"customize" | "sections" | "appearance">("customize");
  const [previewMode, setPreviewMode] = useState<"desktop" | "mobile">("desktop");

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
            <h2 className="font-bold text-xl text-foreground">Help Center Builder</h2>
            <p className="text-sm text-muted-foreground">Customize your customer help center</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" leftIcon={<Eye className="h-4 w-4" />}>
            Preview
          </Button>
          <Button variant="primary" size="sm">
            Publish Changes
          </Button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
        <StatCard title="Published Articles" value="87" />
        <StatCard title="Categories" value="6" />
        <StatCard title="Views This Month" value="12.4K" />
        <StatCard title="Help Center URL" value="help.nucleo.one" />
      </div>

      {/* Tabs */}
      <div className="border-b border-border">
        <nav className="flex gap-4">
          {[
            { id: "customize", label: "Customize" },
            { id: "sections", label: "Sections" },
            { id: "appearance", label: "Appearance" },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as typeof activeTab)}
              className={`px-3 py-2.5 text-sm font-medium transition-colors border-b-2 ${
                activeTab === tab.id
                  ? "border-primary text-primary"
                  : "border-transparent text-muted-foreground hover:text-foreground"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </nav>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* Settings Panel */}
        <Card className="lg:col-span-1">
          <CardHeader>
            <CardTitle className="text-sm font-bold uppercase tracking-tight text-muted-foreground">
              {activeTab === "customize" ? "Basic Settings" : activeTab === "sections" ? "Section Order" : "Appearance"}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {activeTab === "customize" && (
              <>
                {customizationOptions.map((option) => (
                  <div key={option.id}>
                    <label className="mb-1 block text-xs font-medium text-muted-foreground">{option.label}</label>
                    <input
                      type="text"
                      defaultValue={option.value}
                      className="flex h-10 w-full rounded-lg border border-border bg-card px-3 py-2 text-sm"
                    />
                  </div>
                ))}
                <div className="pt-4 border-t border-border">
                  <label className="mb-2 block text-xs font-medium text-muted-foreground">Brand Colors</label>
                  <div className="flex items-center gap-3">
                    <div className="h-10 w-10 rounded-lg border border-border" style={{ backgroundColor: "#22d3ee" }} />
                    <div className="h-10 w-10 rounded-lg border border-border" style={{ backgroundColor: "#a78bfa" }} />
                    <Button variant="outline" size="sm">Add Color</Button>
                  </div>
                </div>
              </>
            )}

            {activeTab === "sections" && (
              <div className="space-y-2">
                {sections.filter(s => s.enabled).sort((a, b) => a.order - b.order).map((section) => {
                  const Icon = section.icon;
                  return (
                    <div key={section.id} className="flex items-center justify-between rounded-lg border border-border p-3">
                      <div className="flex items-center gap-3">
                        <Layout className="h-4 w-4 text-muted-foreground cursor-grab" />
                        <Icon className="h-4 w-4 text-muted-foreground" />
                        <span className="text-sm font-medium">{section.name}</span>
                      </div>
                      <span className="text-xs text-muted-foreground">{section.articles} articles</span>
                    </div>
                  );
                })}
              </div>
            )}

            {activeTab === "appearance" && (
              <div className="space-y-4">
                {appearanceSettings.map((setting) => (
                  <div key={setting.id}>
                    <label className="mb-2 block text-xs font-medium text-muted-foreground">{setting.label}</label>
                    <select className="flex h-10 w-full rounded-lg border border-border bg-card px-3 py-2 text-sm">
                      {setting.options.map((option) => (
                        <option key={option} value={option.toLowerCase()}>{option}</option>
                      ))}
                    </select>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Preview */}
        <Card className="lg:col-span-2">
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="text-sm font-bold uppercase tracking-tight text-muted-foreground">
              Preview
            </CardTitle>
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
          </CardHeader>
          <CardContent>
            <div
              className={`mx-auto bg-white transition-all ${
                previewMode === "mobile" ? "w-[375px] rounded-lg border border-border" : ""
              }`}
            >
              {/* Help Center Preview */}
              <div className="min-h-[500px] bg-gray-50 p-4">
                {/* Header */}
                <div className="rounded-lg bg-white p-4 shadow-sm mb-4">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="h-8 w-8 rounded bg-primary" />
                    <div>
                      <h1 className="font-bold text-lg">Nucleo One Help Center</h1>
                      <p className="text-xs text-muted-foreground">Get help and support</p>
                    </div>
                  </div>
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                    <input
                      type="text"
                      placeholder="Search for answers..."
                      className="w-full rounded-lg border border-border bg-gray-50 pl-10 pr-4 py-2 text-sm"
                    />
                  </div>
                </div>

                {/* Categories */}
                <div className="grid grid-cols-2 gap-3 mb-4">
                  {sections.filter(s => s.enabled).slice(0, 4).map((section) => {
                    const Icon = section.icon;
                    return (
                      <div key={section.id} className="rounded-lg bg-white p-4 shadow-sm">
                        <Icon className="h-6 w-6 text-primary mb-2" />
                        <p className="font-medium text-sm">{section.name}</p>
                        <p className="text-xs text-muted-foreground">{section.articles} articles</p>
                      </div>
                    );
                  })}
                </div>

                {/* Popular Articles */}
                <div className="rounded-lg bg-white p-4 shadow-sm">
                  <h3 className="font-semibold text-sm mb-3">Popular Articles</h3>
                  <div className="space-y-2">
                    <div className="flex items-center gap-2 text-sm text-primary">
                      <BookOpenText className="h-4 w-4" />
                      How to reset your password
                    </div>
                    <div className="flex items-center gap-2 text-sm text-primary">
                      <BookOpenText className="h-4 w-4" />
                      Getting started with Nucleo One
                    </div>
                    <div className="flex items-center gap-2 text-sm text-primary">
                      <BookOpenText className="h-4 w-4" />
                      Understanding your invoice
                    </div>
                  </div>
                </div>

                {/* Footer */}
                <div className="mt-4 text-center text-xs text-muted-foreground">
                  <p>Nucleo One Help Center</p>
                  <p className="mt-1">help.nucleo.one</p>
                </div>
              </div>
            </div>
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
        <p className="font-black text-lg text-foreground mt-0.5">{value}</p>
      </CardContent>
    </Card>
  );
}
