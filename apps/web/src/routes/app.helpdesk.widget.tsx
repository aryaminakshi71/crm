/**
 * Widget Embed Code Generator
 *
 * Generate and customize the support widget for your website.
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
  Check,
  Code,
  Copy,
  Eye,
  Globe,
  Monitor,
  Settings,
  Smartphone,
  Wrench,
} from "lucide-react";
import { useState } from "react";

export const Route = createFileRoute("/app/helpdesk/widget")({
  component: WidgetEmbed,
});

const widgetPositions = [
  { id: "bottom-right", label: "Bottom Right", preview: "BR" },
  { id: "bottom-left", label: "Bottom Left", preview: "BL" },
  { id: "center", label: "Center (Launcher)", preview: "C" },
];

const widgetColors = [
  { id: "cyan", color: "#22d3ee" },
  { id: "violet", color: "#a78bfa" },
  { id: "rose", color: "#f472b6" },
  { id: "emerald", color: "#34d399" },
  { id: "amber", color: "#fbbf24" },
];

const widgetSettings = [
  { id: "chat", label: "Live Chat", enabled: true },
  { id: "knowledge", label: "Knowledge Base Search", enabled: true },
  { id: "ticket", label: "Ticket Submission", enabled: true },
  { id: "faq", label: "FAQ Accordion", enabled: false },
  { id: "contact", label: "Contact Form", enabled: true },
];

function WidgetEmbed() {
  const [position, setPosition] = useState("bottom-right");
  const [primaryColor, setPrimaryColor] = useState("#22d3ee");
  const [isCopied, setIsCopied] = useState(false);
  const [previewMode, setPreviewMode] = useState<"desktop" | "mobile">("desktop");

  const embedCode = `<!-- Nucleo One Support Widget -->
<script>
  window.NucleoSupportConfig = {
    widgetId: "widget_abc123xyz",
    position: "${position}",
    primaryColor: "${primaryColor}",
    zIndex: 99999,
    greeting: "Hi there! How can we help?",
    showKnowledgeBase: true,
    showTicketForm: true,
    onlineAgents: 3
  };
</script>
<script src="https://cdn.nucleo.one/widget/v1/widget.js" async></script>
<!-- End Nucleo One Support Widget -->`;

  const handleCopy = () => {
    navigator.clipboard.writeText(embedCode);
    setIsCopied(true);
    setTimeout(() => setIsCopied(false), 2000);
  };

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
            <h2 className="font-bold text-xl text-foreground">Widget Embed Code</h2>
            <p className="text-sm text-muted-foreground">Generate and customize your support widget</p>
          </div>
        </div>
        <Button variant="primary" size="sm" leftIcon={<Code className="h-4 w-4" />}>
          Save Widget
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
        <StatCard title="Active Widgets" value="1" />
        <StatCard title="Total Embeds" value="12" />
        <StatCard title="Widget Loads" value="45.2K" />
        <StatCard title="Conversations" value="1,234" />
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* Settings */}
        <Card className="lg:col-span-1">
          <CardHeader>
            <CardTitle className="text-sm font-bold uppercase tracking-tight text-muted-foreground">
              Widget Settings
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Position */}
            <div>
              <label className="mb-2 block text-xs font-medium text-muted-foreground">Position</label>
              <div className="grid grid-cols-3 gap-2">
                {widgetPositions.map((pos) => (
                  <button
                    key={pos.id}
                    onClick={() => setPosition(pos.id)}
                    className={`rounded-lg border p-3 text-center transition-colors ${
                      position === pos.id ? "border-primary bg-primary/5" : "border-border hover:border-primary/50"
                    }`}
                  >
                    <div className="mx-auto mb-1 h-8 w-12 rounded border-2 border-current flex items-center justify-center text-xs font-bold">
                      {pos.preview}
                    </div>
                    <span className="text-xs">{pos.label}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Color */}
            <div>
              <label className="mb-2 block text-xs font-medium text-muted-foreground">Primary Color</label>
              <div className="flex items-center gap-3">
                {widgetColors.map((c) => (
                  <button
                    key={c.id}
                    onClick={() => setPrimaryColor(c.color)}
                    className={`h-8 w-8 rounded-full transition-transform ${primaryColor === c.color ? "scale-125 ring-2 ring-offset-2 ring-offset-card" : ""}`}
                    style={{ backgroundColor: c.color }}
                  />
                ))}
                <input
                  type="color"
                  value={primaryColor}
                  onChange={(e) => setPrimaryColor(e.target.value)}
                  className="h-8 w-8 rounded cursor-pointer"
                />
              </div>
            </div>

            {/* Features */}
            <div>
              <label className="mb-2 block text-xs font-medium text-muted-foreground">Enabled Features</label>
              <div className="space-y-2">
                {widgetSettings.map((setting) => (
                  <label key={setting.id} className="flex items-center justify-between rounded-lg border border-border p-2 cursor-pointer">
                    <span className="text-sm">{setting.label}</span>
                    <div className={`relative h-5 w-9 rounded-full transition-colors ${setting.enabled ? "bg-primary" : "bg-muted"}`}>
                      <div className={`absolute top-0.5 h-4 w-4 rounded-full bg-white transition-transform ${setting.enabled ? "translate-x-4" : "translate-x-0.5"}`} />
                    </div>
                  </label>
                ))}
              </div>
            </div>

            {/* Greeting */}
            <div>
              <label className="mb-1 block text-xs font-medium text-muted-foreground">Greeting Message</label>
              <input
                type="text"
                defaultValue="Hi there! How can we help?"
                className="flex h-10 w-full rounded-lg border border-border bg-card px-3 py-2 text-sm"
              />
            </div>
          </CardContent>
        </Card>

        {/* Preview & Code */}
        <Card className="lg:col-span-2">
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="text-sm font-bold uppercase tracking-tight text-muted-foreground">
              Preview & Code
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
          <CardContent className="space-y-4">
            {/* Preview */}
            <div className={`relative mx-auto bg-gray-100 rounded-lg transition-all ${previewMode === "mobile" ? "w-[375px]" : "w-full"}`}>
              <div className={`relative ${previewMode === "mobile" ? "h-[667px]" : "h-[400px]"} bg-white rounded-lg border border-border overflow-hidden`}>
                {/* Mock Website Content */}
                <div className="p-4">
                  <div className="h-8 w-32 bg-gray-200 rounded mb-4" />
                  <div className="h-2 w-full bg-gray-100 rounded mb-2" />
                  <div className="h-2 w-3/4 bg-gray-100 rounded mb-2" />
                  <div className="h-2 w-1/2 bg-gray-100 rounded mb-4" />
                  <div className="h-32 w-full bg-gray-100 rounded mb-4" />
                </div>

                {/* Widget Preview */}
                <div className={`absolute bottom-4 ${position === "bottom-right" ? "right-4" : position === "bottom-left" ? "left-4" : "left-1/2 -translate-x-1/2"}`}>
                  <div
                    className="h-14 w-14 rounded-full shadow-lg flex items-center justify-center cursor-pointer"
                    style={{ backgroundColor: primaryColor }}
                  >
                    <Wrench className="h-6 w-6 text-white" />
                  </div>
                </div>
              </div>
            </div>

            {/* Embed Code */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="text-xs font-medium text-muted-foreground">Embed Code</label>
                <Button variant="ghost" size="sm" leftIcon={<Copy className="h-4 w-4" />} onClick={handleCopy}>
                  {isCopied ? "Copied!" : "Copy"}
                </Button>
              </div>
              <textarea
                readOnly
                value={embedCode}
                className="min-h-[200px] w-full rounded-lg border border-border bg-card p-3 text-xs font-mono"
              />
            </div>

            {/* Installation Instructions */}
            <div className="rounded-lg border border-border p-4">
              <h4 className="font-medium text-sm mb-2">Installation Instructions</h4>
              <ol className="space-y-2 text-xs text-muted-foreground">
                <li className="flex items-start gap-2">
                  <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary">1</span>
                  Copy the embed code above
                </li>
                <li className="flex items-start gap-2">
                  <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary">2</span>
                  Paste it before the closing &lt;/body&gt; tag on your website
                </li>
                <li className="flex items-start gap-2">
                  <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary">3</span>
                  The widget will automatically appear on your site
                </li>
              </ol>
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
        <p className="font-black text-2xl text-foreground mt-0.5">{value}</p>
      </CardContent>
    </Card>
  );
}
