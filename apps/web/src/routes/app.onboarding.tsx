/**
 * Onboarding Wizard
 *
 * Step-by-step setup wizard for new organizations.
 * Covers: profile setup, team invites, module selection, and data import.
 */

import { Button } from "@crm/ui";
import { useQuery } from "@tanstack/react-query";
import { Link, createFileRoute, useNavigate } from "@tanstack/react-router";
import {
  Activity,
  ArrowLeft,
  ArrowRight,
  Building2,
  Check,
  CheckCircle2,
  Cpu,
  Database,
  FileText,
  Globe,
  Mail,
  Palette,
  Shield,
  Sparkles,
  Target,
  Telescope,
  TrendingUp,
  Truck,
  Users,
  Zap,
} from "lucide-react";
import { useState } from "react";
import { NUCLEO_MODULES } from "@/lib/modules";

// ─── Route ────────────────────────────────────────────────────────────────────

export const Route = createFileRoute("/app/onboarding")({
  component: OnboardingWizard,
});

// ─── Types ────────────────────────────────────────────────────────────────────

interface OnboardingData {
  // Step 1: Profile
  orgName: string;
  orgLogo: string | null;
  industry: string;
  website: string;
  // Step 2: Team
  teamSize: string;
  teamMembers: { name: string; email: string; role: string }[];
  // Step 3: Modules
  enabledModules: string[];
  primaryGoal: string;
  // Step 4: Data Import
  importSource: string;
  hasExistingData: boolean;
}

const DEFAULT_DATA: OnboardingData = {
  orgName: "",
  orgLogo: null,
  industry: "",
  website: "",
  teamSize: "",
  teamMembers: [],
  enabledModules: ["crm", "projects", "invoicing"],
  primaryGoal: "",
  importSource: "",
  hasExistingData: false,
};

// ─── Constants ────────────────────────────────────────────────────────────────

const STEPS = [
  { id: "profile", label: "Organization", icon: Building2 },
  { id: "team", label: "Team", icon: Users },
  { id: "modules", label: "Modules", icon: Zap },
  { id: "import", label: "Import Data", icon: Database },
  { id: "complete", label: "Done", icon: CheckCircle2 },
];

const INDUSTRIES = [
  "Technology",
  "Healthcare",
  "Finance & Banking",
  "Retail & E-commerce",
  "Manufacturing",
  "Professional Services",
  "Real Estate",
  "Education",
  "Media & Entertainment",
  "Non-profit",
  "Government",
  "Other",
];

// Onboarding-specific UI metadata — color, benefits — keyed by module key
// Canonical module data (name, description) comes from NUCLEO_MODULES
const MODULE_UI: Record<string, { icon: any; color: string; benefits: string[] }> = {
  crm:           { icon: Target,      color: "cyan",    benefits: ["30% faster deal closing", "Complete customer history"] },
  projects:      { icon: Telescope,    color: "violet",  benefits: ["40% faster delivery", "Real-time progress tracking"] },
  helpdesk:      { icon: Sparkles,    color: "orange",  benefits: ["60% faster ticket resolution", "AI-powered triage"] },
  hrm:           { icon: Users,       color: "indigo",   benefits: ["5 hrs saved per admin weekly", "Automated onboarding"] },
  inventory:     { icon: Palette,     color: "lime",    benefits: ["Real-time stock levels", "Barcode scanning"] },
  monitoring:    { icon: Activity,    color: "sky",     benefits: ["Real-time alerts", "Error tracking"] },
  communications:{ icon: Zap,         color: "teal",    benefits: ["Omnichannel messaging", "Video meetings"] },
  field_service: { icon: Truck,       color: "emerald", benefits: ["Smart dispatch", "Route optimization"] },
  devops:        { icon: Globe,       color: "blue",    benefits: ["One-click deploy", "Pipeline builder"] },
  finance:       { icon: FileText,    color: "amber",   benefits: ["Real-time financial insights", "Automated reconciliation"] },
  invoicing:     { icon: Truck,       color: "yellow",  benefits: ["50% faster invoice creation", "Automated payment reminders"] },
  marketing:     { icon: TrendingUp,  color: "pink",    benefits: ["2x more qualified leads", "Automated drip campaigns"] },
  advertising:   { icon: TrendingUp,  color: "rose",    benefits: ["Multi-platform ads", "AI budget optimization"] },
  social:        { icon: Zap,         color: "violet",  benefits: ["Post scheduling", "Social analytics"] },
  campaign_pro:  { icon: Target,      color: "purple",  benefits: ["A/B testing", "Multi-channel automation"] },
  agents:        { icon: Cpu,         color: "fuchsia", benefits: ["70% task automation", "24/7 AI assistance"] },
  speech:        { icon: Cpu,         color: "red",     benefits: ["Real-time transcription", "Meeting notes"] },
};

// Derive MODULES from NUCLEO_MODULES + onboarding UI metadata
const MODULES = NUCLEO_MODULES.map((m) => ({
  id: m.key,
  label: m.name,
  description: m.description,
  icon: MODULE_UI[m.key]?.icon ?? Target,
  color: MODULE_UI[m.key]?.color ?? "cyan",
  benefits: MODULE_UI[m.key]?.benefits ?? [],
}));

const ROLE_OPTIONS = [
  "Admin",
  "Manager",
  "Sales Rep",
  "Support Agent",
  "Project Manager",
  "Marketer",
  "HR Manager",
  "Finance",
  "Viewer",
];

// ─── Progress Bar ─────────────────────────────────────────────────────────────

function ProgressBar({ step, total }: { step: number; total: number }) {
  const pct = ((step + 1) / total) * 100;
  return (
    <div className="w-full max-w-md mx-auto">
      <div className="flex justify-between text-xs text-muted-foreground mb-2">
        <span>Step {step + 1} of {total}</span>
        <span>{Math.round(pct)}% complete</span>
      </div>
      <div className="h-2 bg-muted rounded-full overflow-hidden">
        <div
          className="h-full bg-primary rounded-full transition-all duration-500 ease-out"
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  );
}

// ─── Step Navigation ──────────────────────────────────────────────────────────

function StepNav({
  currentStep,
  onStepClick,
  canProceed,
}: {
  currentStep: number;
  onStepClick: (step: number) => void;
  canProceed: boolean;
}) {
  return (
    <div className="flex items-center justify-between pt-8 border-t border-border">
      <Button
        variant="ghost"
        onClick={() => onStepClick(currentStep - 1)}
        disabled={currentStep === 0}
        className="gap-2"
      >
        <ArrowLeft className="h-4 w-4" /> Previous
      </Button>
      <div className="flex gap-1">
        {STEPS.slice(0, -1).map((s, i) => (
          <button
            key={s.id}
            onClick={() => i < currentStep && onStepClick(i)}
            disabled={i >= currentStep}
            className={`h-2 w-2 rounded-full transition-all ${i === currentStep ? "bg-primary w-6" : i < currentStep ? "bg-primary/40 hover:bg-primary/60 cursor-pointer" : "bg-muted"}`}
          />
        ))}
      </div>
      <Button
        onClick={() => canProceed && onStepClick(currentStep + 1)}
        disabled={!canProceed}
        className="gap-2"
      >
        {currentStep === STEPS.length - 2 ? "Complete Setup" : "Continue"} <ArrowRight className="h-4 w-4" />
      </Button>
    </div>
  );
}

// ─── Step 1: Organization Profile ────────────────────────────────────────────

function ProfileStep({
  data,
  onChange,
}: {
  data: OnboardingData;
  onChange: (updates: Partial<OnboardingData>) => void;
}) {
  return (
    <div className="space-y-6">
      <div className="text-center">
        <div className="inline-flex h-14 w-14 items-center justify-center rounded-2xl bg-primary/10 mb-4">
          <Building2 className="h-7 w-7 text-primary" />
        </div>
        <h2 className="font-bold text-2xl text-foreground">Set up your organization</h2>
        <p className="text-muted-foreground mt-2">Tell us about your company so we can personalize your experience.</p>
      </div>

      <div className="space-y-4 max-w-lg mx-auto">
        <div>
          <label className="block text-sm font-medium text-foreground mb-2">
            Organization Name *
          </label>
          <input
            type="text"
            value={data.orgName}
            onChange={(e) => onChange({ orgName: e.target.value })}
            placeholder="Acme Corporation"
            className="w-full rounded-lg border border-input bg-background px-4 py-3 text-foreground placeholder:text-muted-foreground focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-foreground mb-2">
            Industry *
          </label>
          <select
            value={data.industry}
            onChange={(e) => onChange({ industry: e.target.value })}
            className="w-full rounded-lg border border-input bg-background px-4 py-3 text-foreground focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
          >
            <option value="">Select your industry</option>
            {INDUSTRIES.map((ind) => (
              <option key={ind} value={ind}>{ind}</option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-foreground mb-2">
            Website
          </label>
          <div className="relative">
            <Globe className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <input
              type="url"
              value={data.website}
              onChange={(e) => onChange({ website: e.target.value })}
              placeholder="https://example.com"
              className="w-full rounded-lg border border-input bg-background pl-11 pr-4 py-3 text-foreground placeholder:text-muted-foreground focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
            />
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Step 2: Team Setup ──────────────────────────────────────────────────────

function TeamStep({
  data,
  onChange,
}: {
  data: OnboardingData;
  onChange: (updates: Partial<OnboardingData>) => void;
}) {
  const [newMember, setNewMember] = useState({ name: "", email: "", role: "Viewer" });

  const addMember = () => {
    if (!newMember.name || !newMember.email) return;
    onChange({ teamMembers: [...data.teamMembers, newMember] });
    setNewMember({ name: "", email: "", role: "Viewer" });
  };

  const removeMember = (index: number) => {
    onChange({ teamMembers: data.teamMembers.filter((_, i) => i !== index) });
  };

  return (
    <div className="space-y-6">
      <div className="text-center">
        <div className="inline-flex h-14 w-14 items-center justify-center rounded-2xl bg-primary/10 mb-4">
          <Users className="h-7 w-7 text-primary" />
        </div>
        <h2 className="font-bold text-2xl text-foreground">Invite your team</h2>
        <p className="text-muted-foreground mt-2">Add colleagues to collaborate. You can skip this and invite later.</p>
      </div>

      <div className="space-y-4 max-w-xl mx-auto">
        <div>
          <label className="block text-sm font-medium text-foreground mb-2">
            Team Size
          </label>
          <div className="grid grid-cols-4 gap-2">
            {["1-5", "6-20", "21-100", "100+"].map((size) => (
              <button
                key={size}
                onClick={() => onChange({ teamSize: size })}
                className={`rounded-lg border px-3 py-2 text-sm font-medium transition-all ${data.teamSize === size ? "border-primary bg-primary/10 text-primary" : "border-border bg-card text-muted-foreground hover:border-primary/40"}`}
              >
                {size}
              </button>
            ))}
          </div>
        </div>

        <div className="border border-border rounded-xl p-4 space-y-3">
          <h3 className="font-semibold text-sm text-foreground">Add Team Members</h3>
          <div className="grid grid-cols-[1fr,1fr,auto,auto] gap-2">
            <input
              type="text"
              value={newMember.name}
              onChange={(e) => setNewMember({ ...newMember, name: e.target.value })}
              placeholder="Name"
              className="rounded-lg border border-input bg-background px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:border-primary focus:outline-none"
            />
            <input
              type="email"
              value={newMember.email}
              onChange={(e) => setNewMember({ ...newMember, email: e.target.value })}
              placeholder="Email"
              className="rounded-lg border border-input bg-background px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:border-primary focus:outline-none"
            />
            <select
              value={newMember.role}
              onChange={(e) => setNewMember({ ...newMember, role: e.target.value })}
              className="rounded-lg border border-input bg-background px-2 py-2 text-sm text-foreground focus:border-primary focus:outline-none"
            >
              {ROLE_OPTIONS.map((role) => (
                <option key={role} value={role}>{role}</option>
              ))}
            </select>
            <Button onClick={addMember} size="sm" variant="outline" className="gap-1">
              <Mail className="h-4 w-4" /> Invite
            </Button>
          </div>
        </div>

        {data.teamMembers.length > 0 && (
          <div className="space-y-2">
            <h3 className="font-semibold text-sm text-foreground">Pending Invites ({data.teamMembers.length})</h3>
            {data.teamMembers.map((member, i) => (
              <div key={i} className="flex items-center justify-between rounded-lg border border-border bg-card px-4 py-3">
                <div className="flex items-center gap-3">
                  <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center">
                    <span className="text-primary text-sm font-semibold">{member.name[0].toUpperCase()}</span>
                  </div>
                  <div>
                    <p className="font-medium text-foreground text-sm">{member.name}</p>
                    <p className="text-muted-foreground text-xs">{member.email}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <span className="text-xs text-muted-foreground bg-muted px-2 py-1 rounded">{member.role}</span>
                  <button onClick={() => removeMember(i)} className="text-muted-foreground hover:text-destructive text-sm">
                    Remove
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}

        <p className="text-xs text-muted-foreground text-center">
          Invitations will be sent when you complete setup. You can also invite team members later from Settings.
        </p>
      </div>
    </div>
  );
}

// ─── Step 3: Module Selection ─────────────────────────────────────────────────

function ModulesStep({
  data,
  onChange,
}: {
  data: OnboardingData;
  onChange: (updates: Partial<OnboardingData>) => void;
}) {
  const toggleModule = (moduleId: string) => {
    const current = data.enabledModules;
    const updated = current.includes(moduleId)
      ? current.filter((m) => m !== moduleId)
      : [...current, moduleId];
    onChange({ enabledModules: updated });
  };

  const colorMap: Record<string, string> = {
    cyan: "border-cyan-500/30 bg-cyan-500/5 hover:border-cyan-500/50",
    violet: "border-violet-500/30 bg-violet-500/5 hover:border-violet-500/50",
    emerald: "border-emerald-500/30 bg-emerald-500/5 hover:border-emerald-500/50",
    orange: "border-orange-500/30 bg-orange-500/5 hover:border-orange-500/50",
    pink: "border-pink-500/30 bg-pink-500/5 hover:border-pink-500/50",
    indigo: "border-indigo-500/30 bg-indigo-500/5 hover:border-indigo-500/50",
    amber: "border-amber-500/30 bg-amber-500/5 hover:border-amber-500/50",
    fuchsia: "border-fuchsia-500/30 bg-fuchsia-500/5 hover:border-fuchsia-500/50",
    lime: "border-lime-500/30 bg-lime-500/5 hover:border-lime-500/50",
    sky: "border-sky-500/30 bg-sky-500/5 hover:border-sky-500/50",
    teal: "border-teal-500/30 bg-teal-500/5 hover:border-teal-500/50",
    blue: "border-blue-500/30 bg-blue-500/5 hover:border-blue-500/50",
    yellow: "border-yellow-500/30 bg-yellow-500/5 hover:border-yellow-500/50",
    rose: "border-rose-500/30 bg-rose-500/5 hover:border-rose-500/50",
    purple: "border-purple-500/30 bg-purple-500/5 hover:border-purple-500/50",
    red: "border-red-500/30 bg-red-500/5 hover:border-red-500/50",
  };

  const iconColorMap: Record<string, string> = {
    cyan: "text-cyan-500",
    violet: "text-violet-500",
    emerald: "text-emerald-500",
    orange: "text-orange-500",
    pink: "text-pink-500",
    indigo: "text-indigo-500",
    amber: "text-amber-500",
    fuchsia: "text-fuchsia-500",
    lime: "text-lime-500",
    sky: "text-sky-500",
    teal: "text-teal-500",
    blue: "text-blue-500",
    yellow: "text-yellow-500",
    rose: "text-rose-500",
    purple: "text-purple-500",
    red: "text-red-500",
  };

  return (
    <div className="space-y-6">
      <div className="text-center">
        <div className="inline-flex h-14 w-14 items-center justify-center rounded-2xl bg-primary/10 mb-4">
          <Zap className="h-7 w-7 text-primary" />
        </div>
        <h2 className="font-bold text-2xl text-foreground">Choose your modules</h2>
        <p className="text-muted-foreground mt-2">Select the features you want to enable. You can change these later.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-w-2xl mx-auto">
        {MODULES.map((mod) => {
          const isSelected = data.enabledModules.includes(mod.id);
          return (
            <button
              key={mod.id}
              onClick={() => toggleModule(mod.id)}
              className={`relative rounded-xl border-2 p-5 text-left transition-all ${isSelected ? colorMap[mod.color] + " border-current" : "border-border bg-card hover:border-muted-foreground/30"}`}
            >
              {isSelected && (
                <div className="absolute top-3 right-3">
                  <CheckCircle2 className={`h-5 w-5 ${iconColorMap[mod.color]}`} />
                </div>
              )}
              <div className="flex items-start gap-4">
                <div className={`rounded-xl bg-muted p-3 ${isSelected ? "" : ""}`}>
                  <mod.icon className={`h-6 w-6 ${isSelected ? iconColorMap[mod.color] : "text-muted-foreground"}`} />
                </div>
                <div className="flex-1">
                  <h3 className="font-bold text-foreground">{mod.label}</h3>
                  <p className="text-xs text-muted-foreground mt-1">{mod.description}</p>
                  {isSelected && (
                    <div className="mt-2 flex flex-wrap gap-1">
                      {mod.benefits.map((b, i) => (
                        <span key={i} className="text-[10px] bg-success/10 text-success px-2 py-0.5 rounded-full">
                          {b}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </button>
          );
        })}
      </div>

      <div className="max-w-lg mx-auto">
        <label className="block text-sm font-medium text-foreground mb-2">
          What's your primary goal? (Optional)
        </label>
        <select
          value={data.primaryGoal}
          onChange={(e) => onChange({ primaryGoal: e.target.value })}
          className="w-full rounded-lg border border-input bg-background px-4 py-3 text-foreground focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
        >
          <option value="">Select your primary goal</option>
          <option value="increase_revenue">Increase Revenue</option>
          <option value="reduce_costs">Reduce Costs</option>
          <option value="improve_efficiency">Improve Efficiency</option>
          <option value="better_customer_experience">Better Customer Experience</option>
          <option value="scale_operations">Scale Operations</option>
        </select>
      </div>
    </div>
  );
}

// ─── Step 4: Data Import ──────────────────────────────────────────────────────

function ImportStep({
  data,
  onChange,
}: {
  data: OnboardingData;
  onChange: (updates: Partial<OnboardingData>) => void;
}) {
  const importOptions = [
    {
      id: "csv",
      label: "CSV / Excel Import",
      description: "Import contacts, leads, or other data from CSV or Excel files",
      icon: FileText,
    },
    {
      id: "salesforce",
      label: "Salesforce",
      description: "Migrate your CRM data from Salesforce",
      icon: Database,
    },
    {
      id: "hubspot",
      label: "HubSpot",
      description: "Import your HubSpot contacts and deals",
      icon: Database,
    },
    {
      id: "zoho",
      label: "Zoho CRM",
      description: "Transfer data from Zoho CRM",
      icon: Database,
    },
    {
      id: "none",
      label: "Start Fresh",
      description: "Begin with an empty workspace — no data to import",
      icon: Sparkles,
    },
  ];

  return (
    <div className="space-y-6">
      <div className="text-center">
        <div className="inline-flex h-14 w-14 items-center justify-center rounded-2xl bg-primary/10 mb-4">
          <Database className="h-7 w-7 text-primary" />
        </div>
        <h2 className="font-bold text-2xl text-foreground">Import your data</h2>
        <p className="text-muted-foreground mt-2">Get started faster by importing your existing data. You can also skip this step.</p>
      </div>

      <div className="space-y-4 max-w-xl mx-auto">
        <div className="mb-6">
          <p className="text-sm font-medium text-foreground mb-3">Do you have existing data to import?</p>
          <div className="flex gap-3">
            <button
              onClick={() => onChange({ hasExistingData: true })}
              className={`flex-1 rounded-lg border-2 p-4 text-center transition-all ${data.hasExistingData ? "border-primary bg-primary/5" : "border-border hover:border-primary/40"}`}
            >
              <Database className={`h-6 w-6 mx-auto mb-2 ${data.hasExistingData ? "text-primary" : "text-muted-foreground"}`} />
              <p className={`font-semibold text-sm ${data.hasExistingData ? "text-primary" : "text-foreground"}`}>Yes, I have data</p>
            </button>
            <button
              onClick={() => onChange({ hasExistingData: false })}
              className={`flex-1 rounded-lg border-2 p-4 text-center transition-all ${!data.hasExistingData ? "border-primary bg-primary/5" : "border-border hover:border-primary/40"}`}
            >
              <Sparkles className={`h-6 w-6 mx-auto mb-2 ${!data.hasExistingData ? "text-primary" : "text-muted-foreground"}`} />
              <p className={`font-semibold text-sm ${!data.hasExistingData ? "text-primary" : "text-foreground"}`}>No, start fresh</p>
            </button>
          </div>
        </div>

        {data.hasExistingData && (
          <div className="space-y-3">
            <p className="text-sm font-medium text-foreground">Select import source:</p>
            {importOptions.filter(o => o.id !== "none").map((opt) => (
              <button
                key={opt.id}
                onClick={() => onChange({ importSource: opt.id })}
                className={`w-full flex items-center gap-4 rounded-xl border p-4 text-left transition-all ${data.importSource === opt.id ? "border-primary bg-primary/5" : "border-border hover:border-muted-foreground/30"}`}
              >
                <div className={`rounded-lg bg-muted p-2 ${data.importSource === opt.id ? "bg-primary/10" : ""}`}>
                  <opt.icon className={`h-5 w-5 ${data.importSource === opt.id ? "text-primary" : "text-muted-foreground"}`} />
                </div>
                <div>
                  <p className={`font-semibold text-sm ${data.importSource === opt.id ? "text-primary" : "text-foreground"}`}>{opt.label}</p>
                  <p className="text-xs text-muted-foreground">{opt.description}</p>
                </div>
                {data.importSource === opt.id && (
                  <CheckCircle2 className="h-5 w-5 text-primary ml-auto" />
                )}
              </button>
            ))}
            <p className="text-xs text-muted-foreground pt-2">
              After setup, go to Settings → Data Import to upload your files or connect to external services.
            </p>
          </div>
        )}

        {!data.hasExistingData && (
          <div className="rounded-xl border border-border bg-card p-6 text-center">
            <Sparkles className="h-10 w-10 text-primary mx-auto mb-3" />
            <h3 className="font-bold text-foreground mb-2">Ready to start fresh</h3>
            <p className="text-sm text-muted-foreground">
              You'll be able to add data manually or import later. Nucleo One works great even without existing data — start by adding your first contact!
            </p>
          </div>
        )}
      </div>
    </div>
  );
}

// ─── Step 5: Complete ────────────────────────────────────────────────────────

function CompleteStep({ data }: { data: OnboardingData }) {
  const navigate = useNavigate();

  return (
    <div className="space-y-8 text-center">
      <div className="space-y-4">
        <div className="inline-flex h-20 w-20 items-center justify-center rounded-full bg-success/10">
          <CheckCircle2 className="h-10 w-10 text-success" />
        </div>
        <h2 className="font-bold text-3xl text-foreground">You're all set!</h2>
        <p className="text-muted-foreground max-w-md mx-auto">
          {data.orgName || "Your organization"} is ready. Here's what we configured for you:
        </p>
      </div>

      <div className="max-w-lg mx-auto space-y-4">
        <div className="rounded-xl border border-border bg-card p-5 space-y-4">
          <div className="flex items-center gap-3">
            <Building2 className="h-5 w-5 text-primary" />
            <div className="text-left">
              <p className="font-semibold text-foreground">{data.orgName || "Organization"}</p>
              <p className="text-xs text-muted-foreground">{data.industry || "Your industry"}</p>
            </div>
            <Check className="h-5 w-5 text-success ml-auto" />
          </div>

          <div className="border-t border-border pt-4">
            <p className="text-xs font-semibold text-muted-foreground mb-3">ENABLED MODULES</p>
            <div className="flex flex-wrap gap-2">
              {data.enabledModules.map((modId) => {
                const mod = MODULES.find((m) => m.id === modId);
                return mod ? (
                  <span key={modId} className="inline-flex items-center gap-1 rounded-full bg-primary/10 px-3 py-1 text-xs font-medium text-primary">
                    <mod.icon className="h-3 w-3" />
                    {mod.label}
                  </span>
                ) : null;
              })}
            </div>
          </div>

          {data.teamMembers.length > 0 && (
            <div className="border-t border-border pt-4">
              <p className="text-xs font-semibold text-muted-foreground mb-3">TEAM INVITATIONS PENDING</p>
              <p className="text-sm text-foreground">{data.teamMembers.length} invitation{data.teamMembers.length !== 1 ? "s" : ""} will be sent</p>
            </div>
          )}
        </div>

        <div className="rounded-xl border border-primary/20 bg-primary/5 p-5">
          <div className="flex items-center gap-3 mb-3">
            <Shield className="h-5 w-5 text-primary" />
            <p className="font-semibold text-foreground">Your 14-day trial is active</p>
          </div>
          <p className="text-sm text-muted-foreground text-left">
            Full access to all features. No credit card required. After trial, choose a plan that fits your team.
          </p>
        </div>
      </div>

      <div className="flex flex-col gap-3 max-w-xs mx-auto">
        <Button
          size="lg"
          onClick={() => navigate({ to: "/app" })}
          className="gap-2"
        >
          Go to Dashboard <ArrowRight className="h-4 w-4" />
        </Button>
        <div className="flex items-center justify-center gap-6 text-sm">
          <Link to="/app/crm" className="text-muted-foreground hover:text-primary">Add First Contact</Link>
          <Link to="/app/projects" className="text-muted-foreground hover:text-primary">Create Project</Link>
          <Link to="/roi-calculator" className="text-muted-foreground hover:text-primary">ROI Calculator</Link>
        </div>
      </div>
    </div>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────

function OnboardingWizard() {
  const [currentStep, setCurrentStep] = useState(0);
  const [data, setData] = useState<OnboardingData>(() => {
    // Try to restore from localStorage
    if (typeof window !== "undefined") {
      const saved = localStorage.getItem("onboarding_data");
      if (saved) {
        try {
          return { ...DEFAULT_DATA, ...JSON.parse(saved) };
        } catch {
          return DEFAULT_DATA;
        }
      }
    }
    return DEFAULT_DATA;
  });

  const updateData = (updates: Partial<OnboardingData>) => {
    setData((prev) => {
      const next = { ...prev, ...updates };
      // Persist to localStorage
      if (typeof window !== "undefined") {
        localStorage.setItem("onboarding_data", JSON.stringify(next));
      }
      return next;
    });
  };

  const canProceed = () => {
    switch (currentStep) {
      case 0:
        return data.orgName.trim().length > 0 && data.industry.trim().length > 0;
      case 1:
        return true; // Team is optional
      case 2:
        return data.enabledModules.length > 0;
      case 3:
        return true; // Import is optional
      default:
        return true;
    }
  };

  const handleStepClick = (step: number) => {
    if (step < currentStep || (step === currentStep + 1 && canProceed())) {
      setCurrentStep(step);
    }
  };

  const renderStep = () => {
    switch (currentStep) {
      case 0:
        return <ProfileStep data={data} onChange={updateData} />;
      case 1:
        return <TeamStep data={data} onChange={updateData} />;
      case 2:
        return <ModulesStep data={data} onChange={updateData} />;
      case 3:
        return <ImportStep data={data} onChange={updateData} />;
      case 4:
        return <CompleteStep data={data} />;
      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen bg-background text-foreground">
      {/* Header */}
      <header className="border-b border-border/60 bg-card/50">
        <div className="mx-auto max-w-5xl px-4 py-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between">
            <Link
              to="/"
              className="inline-flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors"
            >
              <ArrowLeft className="h-4 w-4" />
              Back to Nucleo One
            </Link>
            <Link
              to="/app"
              className="text-sm text-muted-foreground hover:text-primary transition-colors"
            >
              Skip setup
            </Link>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-4xl px-4 py-12 sm:px-6 lg:px-8">
        {/* Step indicators */}
        {currentStep < STEPS.length - 1 && (
          <div className="mb-12">
            <ProgressBar step={currentStep} total={STEPS.length - 1} />
          </div>
        )}

        {/* Step content */}
        <div className="min-h-[400px]">
          {renderStep()}
        </div>

        {/* Navigation */}
        {currentStep < STEPS.length - 1 && (
          <StepNav
            currentStep={currentStep}
            onStepClick={handleStepClick}
            canProceed={canProceed()}
          />
        )}
      </main>
    </div>
  );
}
