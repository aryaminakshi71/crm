/**
 * Email Builder
 *
 * Drag-and-drop email builder with templates and WYSIWYG preview.
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
  Bold,
  Check,
  Code,
  Eye,
  Globe,
  GripVertical,
  Heading1,
  Image,
  Italic,
  Layout,
  Link2,
  List,
  Mail,
  Monitor,
  Moon,
  Palette,
  Plus,
  Save,
  Send,
  Settings,
  Smartphone,
  Square,
  Sun,
  Table,
  Type,
  Undo,
  Upload,
} from "lucide-react";
import { useState } from "react";

export const Route = createFileRoute("/app/marketing/email-builder")({
  component: EmailBuilder,
});

const templates = [
  { id: "1", name: "Newsletter", thumbnail: "newsletter", category: "content" },
  { id: "2", name: "Promotional", thumbnail: "promo", category: "sales" },
  { id: "3", name: "Welcome Series", thumbnail: "welcome", category: "onboarding" },
  { id: "4", name: "Event Invite", thumbnail: "event", category: "events" },
  { id: "5", name: "Product Launch", thumbnail: "launch", category: "sales" },
  { id: "6", name: "Follow-up", thumbnail: "followup", category: "automation" },
];

const emailComponents = [
  { id: "header", name: "Header", icon: Layout },
  { id: "text", name: "Text Block", icon: Type },
  { id: "image", name: "Image", icon: Image },
  { id: "button", name: "Button", icon: Square },
  { id: "divider", name: "Divider", icon: Minus },
  { id: "social", name: "Social Links", icon: Link2 },
  { id: "footer", name: "Footer", icon: Layout },
];

function Minus({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <line x1="5" y1="12" x2="19" y2="12" />
    </svg>
  );
}

function EmailBuilder() {
  const [activeTemplate, setActiveTemplate] = useState("1");
  const [previewMode, setPreviewMode] = useState<"desktop" | "mobile">("desktop");
  const [selectedComponent, setSelectedComponent] = useState<string | null>(null);
  const [showTemplates, setShowTemplates] = useState(false);
  const [subject, setSubject] = useState("Spring Sale 2026 - Up to 50% Off!");
  const [preheader, setPreheader] = useState("Don't miss out on our biggest sale of the year");

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="flex items-center gap-4">
          <Link to="/app/marketing/campaigns">
            <Button variant="ghost" size="sm" leftIcon={<ArrowLeft className="h-4 w-4" />}>
              Back
            </Button>
          </Link>
          <div>
            <h2 className="font-bold text-xl text-foreground">Email Builder</h2>
            <p className="text-sm text-muted-foreground">Design your email with drag-and-drop components</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" leftIcon={<Eye className="h-4 w-4" />}>
            Preview
          </Button>
          <Button variant="outline" size="sm" leftIcon={<Save className="h-4 w-4" />}>
            Save Draft
          </Button>
          <Button variant="primary" size="sm" leftIcon={<Send className="h-4 w-4" />}>
            Send Test
          </Button>
        </div>
      </div>

      {/* Email Settings */}
      <Card>
        <CardContent className="p-4">
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <div>
              <label className="mb-1 block text-xs font-medium text-muted-foreground">Subject Line</label>
              <input
                type="text"
                value={subject}
                onChange={(e) => setSubject(e.target.value)}
                className="flex h-10 w-full rounded-lg border border-border bg-card px-3 py-2 text-sm"
                placeholder="Enter subject line"
              />
            </div>
            <div>
              <label className="mb-1 block text-xs font-medium text-muted-foreground">Preheader Text</label>
              <input
                type="text"
                value={preheader}
                onChange={(e) => setPreheader(e.target.value)}
                className="flex h-10 w-full rounded-lg border border-border bg-card px-3 py-2 text-sm"
                placeholder="Preview text shown after subject"
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Builder Interface */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-4">
        {/* Left Sidebar - Components */}
        <Card className="lg:col-span-1">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-bold uppercase tracking-tight text-muted-foreground">
              Components
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <Button variant="outline" className="w-full justify-start" leftIcon={<Layout className="h-4 w-4" />} onClick={() => setShowTemplates(!showTemplates)}>
              Templates
            </Button>
            {showTemplates && (
              <div className="ml-4 space-y-2 border-l border-border pl-4">
                {templates.map((template) => (
                  <button
                    key={template.id}
                    onClick={() => setActiveTemplate(template.id)}
                    className={`flex w-full items-center gap-2 rounded-lg p-2 text-left text-sm transition-colors ${
                      activeTemplate === template.id ? "bg-primary/10 text-primary" : "hover:bg-muted"
                    }`}
                  >
                    <Layout className="h-4 w-4" />
                    {template.name}
                  </button>
                ))}
              </div>
            )}
            <div className="border-t border-border pt-2">
              <p className="mb-2 text-xs font-medium text-muted-foreground">Drag to add</p>
              {emailComponents.map((component) => {
                const Icon = component.icon;
                return (
                  <div
                    key={component.id}
                    draggable
                    className="mb-1 flex cursor-grab items-center gap-2 rounded-lg p-2 text-sm hover:bg-muted"
                  >
                    <GripVertical className="h-4 w-4 text-muted-foreground" />
                    <Icon className="h-4 w-4" />
                    {component.name}
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>

        {/* Center - Email Canvas */}
        <Card className="lg:col-span-2">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-bold uppercase tracking-tight text-muted-foreground">
              Email Canvas
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
              className={`mx-auto bg-white transition-all ${previewMode === "mobile" ? "w-[320px] rounded-lg border border-border" : ""}`}
            >
              {/* Email Header */}
              <div className="border-b border-gray-200 p-4">
                <div className="flex items-center justify-between">
                  <div className="h-8 w-32 bg-gradient-to-r from-primary to-violet-500 rounded" />
                  <div className="flex gap-2">
                    <button className="text-gray-400 hover:text-gray-600">
                      <Bold className="h-4 w-4" />
                    </button>
                    <button className="text-gray-400 hover:text-gray-600">
                      <Italic className="h-4 w-4" />
                    </button>
                    <button className="text-gray-400 hover:text-gray-600">
                      <Underline className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              </div>

              {/* Email Hero */}
              <div className="relative">
                <div className="h-48 bg-gradient-to-br from-primary/20 to-violet-500/20 flex items-center justify-center">
                  <div className="h-24 w-24 rounded-xl bg-gray-200" />
                </div>
              </div>

              {/* Email Content */}
              <div className="p-6 space-y-4">
                <h1 className="text-2xl font-bold text-gray-900 text-center">
                  Spring Sale 2026
                </h1>
                <p className="text-gray-600 text-center">
                  Don't miss our biggest sale of the year! Get up to 50% off on selected items.
                </p>
                <div className="flex justify-center py-4">
                  <button className="rounded-lg bg-primary px-8 py-3 text-white font-medium">
                    Shop Now
                  </button>
                </div>
              </div>

              {/* Email Footer */}
              <div className="border-t border-gray-200 p-4 text-center">
                <p className="text-xs text-gray-500">
                  This email was sent by Your Company<br />
                  123 Business St, City, State 12345<br />
                  <a href="#" className="text-primary">Unsubscribe</a> | <a href="#" className="text-primary">View in browser</a>
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Right Sidebar - Properties */}
        <Card className="lg:col-span-1">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-bold uppercase tracking-tight text-muted-foreground">
              Properties
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <label className="mb-1 block text-xs font-medium text-muted-foreground">Background Color</label>
              <div className="flex items-center gap-2">
                <button className="h-8 w-8 rounded-lg border border-border bg-white" />
                <input type="text" defaultValue="#FFFFFF" className="flex h-8 flex-1 rounded-lg border border-border bg-card px-2 text-xs" />
              </div>
            </div>
            <div>
              <label className="mb-1 block text-xs font-medium text-muted-foreground">Font Family</label>
              <select className="flex h-10 w-full rounded-lg border border-border bg-card px-3 py-2 text-sm">
                <option>Arial</option>
                <option>Helvetica</option>
                <option>Times New Roman</option>
                <option>Georgia</option>
              </select>
            </div>
            <div>
              <label className="mb-1 block text-xs font-medium text-muted-foreground">Font Size</label>
              <select className="flex h-10 w-full rounded-lg border border-border bg-card px-3 py-2 text-sm">
                <option>12px</option>
                <option>14px</option>
                <option>16px</option>
                <option>18px</option>
                <option>20px</option>
              </select>
            </div>
            <div>
              <label className="mb-1 block text-xs font-medium text-muted-foreground">Text Color</label>
              <div className="flex items-center gap-2">
                <button className="h-8 w-8 rounded-lg border border-border bg-gray-900" />
                <input type="text" defaultValue="#1F2937" className="flex h-8 flex-1 rounded-lg border border-border bg-card px-2 text-xs" />
              </div>
            </div>
            <div className="border-t border-border pt-4">
              <p className="mb-2 text-xs font-medium text-muted-foreground">Padding</p>
              <div className="grid grid-cols-4 gap-2">
                <input type="text" defaultValue="0" className="flex h-8 rounded-lg border border-border bg-card px-2 text-xs text-center" />
                <input type="text" defaultValue="0" className="flex h-8 rounded-lg border border-border bg-card px-2 text-xs text-center" />
                <input type="text" defaultValue="0" className="flex h-8 rounded-lg border border-border bg-card px-2 text-xs text-center" />
                <input type="text" defaultValue="0" className="flex h-8 rounded-lg border border-border bg-card px-2 text-xs text-center" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

function Underline({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M6 3v7a6 6 0 0 0 6 6 6 6 0 0 0 6-6V3" />
      <line x1="4" y1="21" x2="20" y2="21" />
    </svg>
  );
}
