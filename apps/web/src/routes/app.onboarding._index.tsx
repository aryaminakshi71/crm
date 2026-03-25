/**
 * Onboarding Wizard
 *
 * Step-by-step setup guide for new organizations.
 */

import { Button, Card, CardContent, CardHeader, CardTitle, Input } from "@crm/ui";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { Building2, Check, Database, Mail, Puzzle, Settings2 } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

export const Route = createFileRoute("/app/onboarding/_index")({
  component: OnboardingPage,
});

const LS_STEP = "nucleo_onboarding_step";
const LS_DATA = "nucleo_onboarding_data";

const STEPS = [
  { id: 1, label: "Company Info", icon: Building2 },
  { id: 2, label: "Invite Team", icon: Mail },
  { id: 3, label: "Connect Integrations", icon: Puzzle },
  { id: 4, label: "Import Data", icon: Database },
  { id: 5, label: "Configure Modules", icon: Settings2 },
];

const INTEGRATION_OPTIONS = [
  "Salesforce", "HubSpot", "Stripe", "QuickBooks", "Slack", "Google Workspace",
  "Microsoft 365", "Shopify", "Zendesk", "Mailchimp",
];

const MODULE_OPTIONS = [
  "CRM", "eCommerce", "Invoicing", "Projects", "HRM", "Helpdesk",
  "Field Service", "DevOps", "Marketing", "Inventory",
];

function OnboardingPage() {
  const navigate = useNavigate();

  const [currentStep, setCurrentStep] = useState<number>(() => {
    const saved = localStorage.getItem(LS_STEP);
    return saved ? parseInt(saved, 10) : 1;
  });

  const [formData, setFormData] = useState<Record<string, any>>(() => {
    try {
      return JSON.parse(localStorage.getItem(LS_DATA) ?? "{}");
    } catch {
      return {};
    }
  });

  function saveProgress(step: number, data: Record<string, any>) {
    localStorage.setItem(LS_STEP, String(step));
    localStorage.setItem(LS_DATA, JSON.stringify(data));
  }

  function handleNext() {
    if (currentStep < 5) {
      const next = currentStep + 1;
      setCurrentStep(next);
      saveProgress(next, formData);
    }
  }

  function handlePrev() {
    if (currentStep > 1) {
      const prev = currentStep - 1;
      setCurrentStep(prev);
      saveProgress(prev, formData);
    }
  }

  function handleComplete() {
    localStorage.setItem(LS_STEP, "done");
    toast.success("Setup complete! Welcome to Nucleo One.");
    navigate({ to: "/app" });
  }

  function updateField(key: string, value: any) {
    const updated = { ...formData, [key]: value };
    setFormData(updated);
    saveProgress(currentStep, updated);
  }

  function toggleArrayItem(key: string, item: string) {
    const arr: string[] = formData[key] ?? [];
    const updated = arr.includes(item) ? arr.filter((x) => x !== item) : [...arr, item];
    updateField(key, updated);
  }

  const progress = Math.round(((currentStep - 1) / (STEPS.length - 1)) * 100);

  return (
    <div className="max-w-2xl mx-auto space-y-6 py-6">
      <div>
        <h1 className="text-2xl font-bold">Get Started with Nucleo One</h1>
        <p className="text-muted-foreground mt-1">
          Complete your setup in {STEPS.length} easy steps
        </p>
      </div>

      {/* Progress Bar */}
      <div className="space-y-2">
        <div className="flex items-center justify-between text-xs text-muted-foreground">
          <span>Step {currentStep} of {STEPS.length}</span>
          <span>{progress}% complete</span>
        </div>
        <div className="w-full h-2 bg-muted rounded-full overflow-hidden">
          <div
            className="h-full bg-primary rounded-full transition-all duration-300"
            style={{ width: `${progress}%` }}
          />
        </div>
      </div>

      {/* Step Indicators */}
      <div className="flex items-center gap-1">
        {STEPS.map((step, i) => {
          const Icon = step.icon;
          const done = currentStep > step.id;
          const active = currentStep === step.id;
          return (
            <div key={step.id} className="flex items-center flex-1">
              <div className="flex flex-col items-center gap-1">
                <div
                  className={`h-8 w-8 rounded-full flex items-center justify-center transition-colors ${
                    done
                      ? "bg-green-500 text-white"
                      : active
                        ? "bg-primary text-primary-foreground"
                        : "bg-muted text-muted-foreground"
                  }`}
                >
                  {done ? <Check className="h-4 w-4" /> : <Icon className="h-4 w-4" />}
                </div>
                <span className={`text-[10px] font-medium hidden sm:block ${active ? "text-primary" : "text-muted-foreground"}`}>
                  {step.label}
                </span>
              </div>
              {i < STEPS.length - 1 && (
                <div className={`flex-1 h-0.5 mx-1 ${done ? "bg-green-400" : "bg-muted"}`} />
              )}
            </div>
          );
        })}
      </div>

      {/* Step Content */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            {(() => {
              const Icon = STEPS[currentStep - 1].icon;
              return <Icon className="h-4 w-4 text-primary" />;
            })()}
            {STEPS[currentStep - 1].label}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {currentStep === 1 && (
            <div className="space-y-3">
              <div>
                <label className="text-xs font-medium text-muted-foreground mb-1 block">Organization Name</label>
                <Input
                  placeholder="Acme Corp"
                  value={formData.orgName ?? ""}
                  onChange={(e) => updateField("orgName", e.target.value)}
                />
              </div>
              <div>
                <label className="text-xs font-medium text-muted-foreground mb-1 block">Industry</label>
                <select
                  value={formData.industry ?? ""}
                  onChange={(e) => updateField("industry", e.target.value)}
                  className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                >
                  <option value="">Select industry...</option>
                  {["Technology", "Healthcare", "Finance", "Retail", "Manufacturing", "Education", "Other"].map((ind) => (
                    <option key={ind} value={ind}>{ind}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="text-xs font-medium text-muted-foreground mb-1 block">Company Size</label>
                <select
                  value={formData.size ?? ""}
                  onChange={(e) => updateField("size", e.target.value)}
                  className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                >
                  <option value="">Select size...</option>
                  {["1-10", "11-50", "51-200", "201-1000", "1000+"].map((s) => (
                    <option key={s} value={s}>{s} employees</option>
                  ))}
                </select>
              </div>
            </div>
          )}

          {currentStep === 2 && (
            <div className="space-y-3">
              <p className="text-sm text-muted-foreground">Invite team members to collaborate</p>
              {[0, 1, 2].map((i) => (
                <div key={i}>
                  <label className="text-xs font-medium text-muted-foreground mb-1 block">
                    Email {i + 1}{i === 0 ? " *" : " (optional)"}
                  </label>
                  <Input
                    type="email"
                    placeholder={`colleague${i + 1}@company.com`}
                    value={formData[`inviteEmail${i}`] ?? ""}
                    onChange={(e) => updateField(`inviteEmail${i}`, e.target.value)}
                  />
                </div>
              ))}
            </div>
          )}

          {currentStep === 3 && (
            <div className="space-y-3">
              <p className="text-sm text-muted-foreground">Select integrations to connect</p>
              <div className="grid grid-cols-2 gap-2">
                {INTEGRATION_OPTIONS.map((int) => {
                  const selected = (formData.integrations ?? []).includes(int);
                  return (
                    <button
                      key={int}
                      onClick={() => toggleArrayItem("integrations", int)}
                      className={`px-3 py-2 rounded-md border text-sm font-medium transition-colors text-left ${
                        selected
                          ? "border-primary bg-primary/10 text-primary"
                          : "border-border bg-background text-foreground hover:bg-muted/50"
                      }`}
                    >
                      {selected && <Check className="h-3.5 w-3.5 inline mr-1.5" />}
                      {int}
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {currentStep === 4 && (
            <div className="space-y-4">
              <p className="text-sm text-muted-foreground">
                Import your existing data to get started quickly
              </p>
              <div className="rounded-xl border-2 border-dashed border-border p-8 text-center">
                <Database className="h-10 w-10 text-muted-foreground mx-auto mb-3" />
                <p className="font-medium text-sm">Upload your data files</p>
                <p className="text-xs text-muted-foreground mt-1">
                  CSV, Excel, or JSON. Contacts, leads, products, and more.
                </p>
                <Button
                  size="sm"
                  variant="outline"
                  className="mt-4"
                  onClick={() => toast.info("Data import available in Settings > Import")}
                >
                  Choose Files
                </Button>
              </div>
              <p className="text-xs text-muted-foreground text-center">
                You can also import data later from Settings
              </p>
            </div>
          )}

          {currentStep === 5 && (
            <div className="space-y-3">
              <p className="text-sm text-muted-foreground">
                Choose which modules to enable for your organization
              </p>
              <div className="grid grid-cols-2 gap-2">
                {MODULE_OPTIONS.map((mod) => {
                  const selected = (formData.modules ?? []).includes(mod);
                  return (
                    <button
                      key={mod}
                      onClick={() => toggleArrayItem("modules", mod)}
                      className={`px-3 py-2 rounded-md border text-sm font-medium transition-colors text-left ${
                        selected
                          ? "border-primary bg-primary/10 text-primary"
                          : "border-border bg-background text-foreground hover:bg-muted/50"
                      }`}
                    >
                      {selected && <Check className="h-3.5 w-3.5 inline mr-1.5" />}
                      {mod}
                    </button>
                  );
                })}
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Navigation */}
      <div className="flex items-center justify-between">
        <Button
          variant="outline"
          onClick={handlePrev}
          disabled={currentStep === 1}
        >
          Previous
        </Button>
        {currentStep < 5 ? (
          <Button onClick={handleNext}>Next</Button>
        ) : (
          <Button onClick={handleComplete} className="gap-2">
            <Check className="h-4 w-4" />
            Complete Setup
          </Button>
        )}
      </div>
    </div>
  );
}
