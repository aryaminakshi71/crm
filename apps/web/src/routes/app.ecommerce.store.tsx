/**
 * Store Customizer
 *
 * Customize store appearance and settings.
 */

import { Badge, Button, Card, CardContent, CardHeader, CardTitle, Input } from "@crm/ui";
import { createFileRoute } from "@tanstack/react-router";
import {
  Store,
  Palette,
  Type,
  Image,
  Save,
  Eye,
  Monitor,
  Smartphone,
  Tablet,
  Layout,
  Settings,
} from "lucide-react";
import { useState } from "react";

export const Route = createFileRoute("/app/ecommerce/store")({
  component: StoreCustomizerPage,
});

function StoreCustomizerPage() {
  const [activeTab, setActiveTab] = useState<"general" | "appearance" | "header" | "footer">("general");
  const [previewDevice, setPreviewDevice] = useState<"desktop" | "tablet" | "mobile">("desktop");

  const storeSettings = {
    storeName: "Nucleo One Store",
    storeDescription: "Your destination for premium products",
    logo: null,
    favicon: null,
    primaryColor: "#2172cd",
    accentColor: "#8b5cf6",
    fontFamily: "Inter",
    layout: "grid",
    itemsPerPage: 12,
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-lg font-semibold text-foreground">Store Customizer</h2>
          <p className="text-sm text-muted-foreground">
            Customize your store appearance and settings
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" leftIcon={<Eye className="h-4 w-4" />}>
            Preview
          </Button>
          <Button leftIcon={<Save className="h-4 w-4" />}>
            Save Changes
          </Button>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-4">
        {/* Settings Panel */}
        <Card className="border-border/60 lg:col-span-1">
          <CardContent className="p-4">
            <div className="space-y-1">
              {[
                { id: "general", label: "General", icon: Settings },
                { id: "appearance", label: "Appearance", icon: Palette },
                { id: "header", label: "Header", icon: Layout },
                { id: "footer", label: "Footer", icon: Layout },
              ].map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id as typeof activeTab)}
                  className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg text-left transition-colors ${
                    activeTab === tab.id
                      ? "bg-primary/10 text-primary"
                      : "text-muted-foreground hover:bg-muted"
                  }`}
                >
                  <tab.icon className="h-4 w-4" />
                  <span className="text-sm font-medium">{tab.label}</span>
                </button>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Settings Content */}
        <div className="lg:col-span-3 space-y-6">
          {activeTab === "general" && (
            <Card className="border-border/60">
              <CardHeader className="pb-3">
                <CardTitle className="text-base font-semibold">General Settings</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <label className="text-sm font-medium text-foreground mb-1 block">Store Name</label>
                  <Input defaultValue={storeSettings.storeName} />
                </div>
                <div>
                  <label className="text-sm font-medium text-foreground mb-1 block">Store Description</label>
                  <textarea
                    className="w-full h-24 rounded-lg border border-input bg-background px-3 py-2 text-sm"
                    defaultValue={storeSettings.storeDescription}
                  />
                </div>
                <div>
                  <label className="text-sm font-medium text-foreground mb-1 block">Logo</label>
                  <div className="border-2 border-dashed border-border rounded-lg p-6 text-center">
                    <Image className="h-8 w-8 text-muted-foreground mx-auto mb-2" />
                    <p className="text-sm text-muted-foreground">Click to upload or drag and drop</p>
                    <p className="text-xs text-muted-foreground">PNG, JPG up to 5MB</p>
                  </div>
                </div>
                <div className="grid gap-4 sm:grid-cols-2">
                  <div>
                    <label className="text-sm font-medium text-foreground mb-1 block">Items Per Page</label>
                    <select className="w-full h-10 rounded-lg border border-input bg-background px-3 text-sm">
                      <option>12</option>
                      <option>24</option>
                      <option>36</option>
                      <option>48</option>
                    </select>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-foreground mb-1 block">Default Layout</label>
                    <select className="w-full h-10 rounded-lg border border-input bg-background px-3 text-sm">
                      <option>Grid</option>
                      <option>List</option>
                    </select>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {activeTab === "appearance" && (
            <Card className="border-border/60">
              <CardHeader className="pb-3">
                <CardTitle className="text-base font-semibold">Appearance</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid gap-4 sm:grid-cols-3">
                  <div>
                    <label className="text-sm font-medium text-foreground mb-1 block">Primary Color</label>
                    <div className="flex items-center gap-2">
                      <input
                        type="color"
                        defaultValue={storeSettings.primaryColor}
                        className="w-10 h-10 rounded border border-input"
                      />
                      <Input defaultValue={storeSettings.primaryColor} className="flex-1" />
                    </div>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-foreground mb-1 block">Accent Color</label>
                    <div className="flex items-center gap-2">
                      <input
                        type="color"
                        defaultValue={storeSettings.accentColor}
                        className="w-10 h-10 rounded border border-input"
                      />
                      <Input defaultValue={storeSettings.accentColor} className="flex-1" />
                    </div>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-foreground mb-1 block">Font Family</label>
                    <select className="w-full h-10 rounded-lg border border-input bg-background px-3 text-sm">
                      <option>Inter</option>
                      <option>Roboto</option>
                      <option>Open Sans</option>
                      <option>Poppins</option>
                    </select>
                  </div>
                </div>
                <div>
                  <label className="text-sm font-medium text-foreground mb-2 block">Theme</label>
                  <div className="grid grid-cols-3 gap-4">
                    {[
                      { id: "light", name: "Light", preview: "bg-white border" },
                      { id: "dark", name: "Dark", preview: "bg-slate-900 border" },
                      { id: "auto", name: "Auto", preview: "bg-gradient-to-r from-white to-slate-900" },
                    ].map((theme) => (
                      <button
                        key={theme.id}
                        className="p-4 rounded-lg border-2 border-border hover:border-primary transition-colors"
                      >
                        <div className={`w-full h-16 rounded ${theme.preview} mb-2`} />
                        <p className="text-sm font-medium">{theme.name}</p>
                      </button>
                    ))}
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {activeTab === "header" && (
            <Card className="border-border/60">
              <CardHeader className="pb-3">
                <CardTitle className="text-base font-semibold">Header Settings</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium text-foreground">Show Search Bar</p>
                    <p className="text-sm text-muted-foreground">Display search in header</p>
                  </div>
                  <input type="checkbox" defaultChecked className="rounded" />
                </div>
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium text-foreground">Show Cart Icon</p>
                    <p className="text-sm text-muted-foreground">Display shopping cart in header</p>
                  </div>
                  <input type="checkbox" defaultChecked className="rounded" />
                </div>
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium text-foreground">Show Wishlist Icon</p>
                    <p className="text-sm text-muted-foreground">Display wishlist in header</p>
                  </div>
                  <input type="checkbox" defaultChecked className="rounded" />
                </div>
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium text-foreground">Show Account Icon</p>
                    <p className="text-sm text-muted-foreground">Display account/login in header</p>
                  </div>
                  <input type="checkbox" defaultChecked className="rounded" />
                </div>
              </CardContent>
            </Card>
          )}

          {activeTab === "footer" && (
            <Card className="border-border/60">
              <CardHeader className="pb-3">
                <CardTitle className="text-base font-semibold">Footer Settings</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <label className="text-sm font-medium text-foreground mb-1 block">Footer Text</label>
                  <textarea
                    className="w-full h-24 rounded-lg border border-input bg-background px-3 py-2 text-sm"
                    defaultValue="2024 Nucleo One Store. All rights reserved."
                  />
                </div>
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium text-foreground">Show Social Links</p>
                    <p className="text-sm text-muted-foreground">Display social media icons</p>
                  </div>
                  <input type="checkbox" defaultChecked className="rounded" />
                </div>
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium text-foreground">Show Newsletter</p>
                    <p className="text-sm text-muted-foreground">Display newsletter signup</p>
                  </div>
                  <input type="checkbox" defaultChecked className="rounded" />
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </div>

      {/* Preview */}
      <Card className="border-border/60">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-base font-semibold">Preview</CardTitle>
            <div className="flex gap-1 bg-muted rounded-lg p-1">
              {[
                { id: "desktop", icon: Monitor },
                { id: "tablet", icon: Tablet },
                { id: "mobile", icon: Smartphone },
              ].map((device) => (
                <button
                  key={device.id}
                  onClick={() => setPreviewDevice(device.id as typeof previewDevice)}
                  className={`p-2 rounded ${
                    previewDevice === device.id ? "bg-background shadow" : ""
                  }`}
                >
                  <device.icon className="h-4 w-4" />
                </button>
              ))}
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div
            className={`mx-auto bg-white rounded-lg border shadow-sm overflow-hidden ${
              previewDevice === "mobile" ? "max-w-[375px]" :
              previewDevice === "tablet" ? "max-w-[768px]" : "max-w-full"
            }`}
          >
            <div className="h-12 bg-primary flex items-center px-4">
              <span className="text-white font-bold">Nucleo One Store</span>
            </div>
            <div className="p-6">
              <div className="grid grid-cols-3 gap-4">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="border rounded-lg p-4">
                    <div className="bg-gray-200 h-32 rounded mb-3" />
                    <div className="bg-gray-200 h-4 w-3/4 rounded mb-2" />
                    <div className="bg-gray-200 h-4 w-1/2 rounded" />
                  </div>
                ))}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
