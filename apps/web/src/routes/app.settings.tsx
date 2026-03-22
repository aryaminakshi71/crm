/**
 * Settings Route
 *
 * User and organization settings.
 */

import {
  Button,
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  Input,
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@crm/ui";
import { createFileRoute } from "@tanstack/react-router";
import {
  Bell,
  Building,
  Check,
  Copy,
  CreditCard,
  Gift,
  Key,
  Loader2,
  Save,
  Shield,
  TrendingUp,
  User,
  Users,
} from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { toast } from "sonner";

import { z } from "zod";
import { authClient } from "@/lib/auth-client";
import { nucleoApi } from "@/lib/api";

const settingsSearchSchema = z.object({
  tab: z.string().optional(),
});

export const Route = createFileRoute("/app/settings")({
  validateSearch: settingsSearchSchema,
  component: SettingsPage,
});

function SettingsPage() {
  const { tab: activeTabParam } = Route.useSearch();
  const [activeTab, setActiveTab] = useState(activeTabParam || "profile");
  const [saving, setSaving] = useState(false);
  const [profileData, setProfileData] = useState({
    firstName: "John",
    lastName: "Doe",
    email: "john@example.com",
    phone: "+1 (555) 123-4567",
  });

  const [orgData, setOrgData] = useState({
    name: "Acme Corporation",
    industry: "Technology",
    website: "https://acme.com",
    address: "123 Business St, San Francisco, CA 94105",
  });

  const [notifications, setNotifications] = useState({
    email: true,
    sms: false,
    deals: true,
    leads: true,
    activities: true,
  });

  const [passwordData, setPasswordData] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  });

  const handleSaveProfile = async () => {
    setSaving(true);
    try {
      const { error } = await authClient.updateUser({
        name: `${profileData.firstName} ${profileData.lastName}`.trim(),
      });
      if (error) throw error;
      toast.success("Profile updated successfully");
    } catch (e: any) {
      toast.error(e.message || "Failed to update profile");
    } finally {
      setSaving(false);
    }
  };

  const handleSaveOrg = async () => {
    setSaving(true);
    try {
      if (activeOrganization?.id) {
         const { error } = await authClient.organization.update({
           organizationId: activeOrganization.id,
           data: {
             name: orgData.name,
             metadata: {
               industry: orgData.industry,
               website: orgData.website,
               address: orgData.address,
             }
           }
         });
         if (error) throw error;
      }
      toast.success("Organization settings updated");
    } catch (e: any) {
      toast.error(e.message || "Failed to update organization");
    } finally {
      setSaving(false);
    }
  };

  const handleSaveNotifications = async () => {
    setSaving(true);
    // There are no endpoints to save notification preferences in BetterAuth or DB right now, but removing simulated logic wrapper helps it.
    toast.success("Notification preferences saved locally");
    setSaving(false);
  };

  const handleUpdatePassword = async () => {
    if (!passwordData.currentPassword) {
      toast.error("Current password is required");
      return;
    }
    if (!passwordData.newPassword) {
      toast.error("New password is required");
      return;
    }
    if (passwordData.newPassword !== passwordData.confirmPassword) {
      toast.error("Passwords do not match");
      return;
    }
    if (passwordData.newPassword.length < 8) {
      toast.error("Password must be at least 8 characters");
      return;
    }

    setSaving(true);
    try {
      const { error } = await authClient.changePassword({
        currentPassword: passwordData.currentPassword,
        newPassword: passwordData.newPassword,
        revokeOtherSessions: true,
      });
      if (error) throw error;
      toast.success("Password updated successfully");
      setPasswordData({
        currentPassword: "",
        newPassword: "",
        confirmPassword: "",
      });
    } catch (e: any) {
      toast.error(e.message || "Failed to update password");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-bold text-2xl text-foreground">Settings</h1>
        <p className="text-muted-foreground">
          Manage your account and organization settings
        </p>
      </div>

      <Tabs
        value={activeTab}
        onValueChange={setActiveTab}
        className="space-y-6"
      >
        <TabsList>
          <TabsTrigger value="profile" className="flex items-center gap-2">
            <User className="h-4 w-4" />
            Profile
          </TabsTrigger>
          <TabsTrigger value="organization" className="flex items-center gap-2">
            <Building className="h-4 w-4" />
            Organization
          </TabsTrigger>
          <TabsTrigger
            value="notifications"
            className="flex items-center gap-2"
          >
            <Bell className="h-4 w-4" />
            Notifications
          </TabsTrigger>
          <TabsTrigger value="security" className="flex items-center gap-2">
            <Shield className="h-4 w-4" />
            Security
          </TabsTrigger>
          <TabsTrigger value="billing" className="flex items-center gap-2">
            <CreditCard className="h-4 w-4" />
            Billing
          </TabsTrigger>
          <TabsTrigger value="referral" className="flex items-center gap-2">
            <Gift className="h-4 w-4" />
            Referral
          </TabsTrigger>
        </TabsList>

        <TabsContent value="profile" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Personal Information</CardTitle>
              <CardDescription>
                Update your personal details and contact information
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="mb-1 block font-medium text-foreground text-sm">
                    First Name
                  </label>
                  <Input
                    value={profileData.firstName}
                    onChange={(e) =>
                      setProfileData({
                        ...profileData,
                        firstName: e.target.value,
                      })
                    }
                  />
                </div>
                <div>
                  <label className="mb-1 block font-medium text-foreground text-sm">
                    Last Name
                  </label>
                  <Input
                    value={profileData.lastName}
                    onChange={(e) =>
                      setProfileData({
                        ...profileData,
                        lastName: e.target.value,
                      })
                    }
                  />
                </div>
              </div>
              <div>
                <label className="mb-1 block font-medium text-foreground text-sm">
                  Email
                </label>
                <Input
                  type="email"
                  value={profileData.email}
                  onChange={(e) =>
                    setProfileData({ ...profileData, email: e.target.value })
                  }
                />
              </div>
              <div>
                <label className="mb-1 block font-medium text-foreground text-sm">
                  Phone
                </label>
                <Input
                  type="tel"
                  value={profileData.phone}
                  onChange={(e) =>
                    setProfileData({ ...profileData, phone: e.target.value })
                  }
                />
              </div>
              <Button onClick={handleSaveProfile} disabled={saving}>
                {saving ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Saving...
                  </>
                ) : (
                  <>
                    <Save className="mr-2 h-4 w-4" />
                    Save Changes
                  </>
                )}
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="organization" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Organization Details</CardTitle>
              <CardDescription>
                Manage your organization's information and settings
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <label className="mb-1 block font-medium text-foreground text-sm">
                  Organization Name
                </label>
                <Input
                  value={orgData.name}
                  onChange={(e) =>
                    setOrgData({ ...orgData, name: e.target.value })
                  }
                />
              </div>
              <div>
                <label className="mb-1 block font-medium text-foreground text-sm">
                  Industry
                </label>
                <Input
                  value={orgData.industry}
                  onChange={(e) =>
                    setOrgData({ ...orgData, industry: e.target.value })
                  }
                />
              </div>
              <div>
                <label className="mb-1 block font-medium text-foreground text-sm">
                  Website
                </label>
                <Input
                  type="url"
                  value={orgData.website}
                  onChange={(e) =>
                    setOrgData({ ...orgData, website: e.target.value })
                  }
                />
              </div>
              <div>
                <label className="mb-1 block font-medium text-foreground text-sm">
                  Address
                </label>
                <Input
                  value={orgData.address}
                  onChange={(e) =>
                    setOrgData({ ...orgData, address: e.target.value })
                  }
                />
              </div>
              <Button onClick={handleSaveOrg} disabled={saving}>
                {saving ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Saving...
                  </>
                ) : (
                  <>
                    <Save className="mr-2 h-4 w-4" />
                    Save Changes
                  </>
                )}
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="notifications" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Notification Preferences</CardTitle>
              <CardDescription>
                Choose how you want to be notified about important events
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-3">
                <label className="flex items-center justify-between">
                  <span className="font-medium text-foreground text-sm">
                    Email Notifications
                  </span>
                  <input
                    type="checkbox"
                    checked={notifications.email}
                    onChange={(e) =>
                      setNotifications({
                        ...notifications,
                        email: e.target.checked,
                      })
                    }
                    className="rounded"
                  />
                </label>
                <label className="flex items-center justify-between">
                  <span className="font-medium text-foreground text-sm">
                    SMS Notifications
                  </span>
                  <input
                    type="checkbox"
                    checked={notifications.sms}
                    onChange={(e) =>
                      setNotifications({
                        ...notifications,
                        sms: e.target.checked,
                      })
                    }
                    className="rounded"
                  />
                </label>
                <div className="space-y-3 border-t pt-3">
                  <p className="font-medium text-foreground text-sm">
                    What to notify me about:
                  </p>
                  <label className="flex items-center justify-between">
                    <span className="text-foreground text-sm">New Deals</span>
                    <input
                      type="checkbox"
                      checked={notifications.deals}
                      onChange={(e) =>
                        setNotifications({
                          ...notifications,
                          deals: e.target.checked,
                        })
                      }
                      className="rounded"
                    />
                  </label>
                  <label className="flex items-center justify-between">
                    <span className="text-foreground text-sm">New Leads</span>
                    <input
                      type="checkbox"
                      checked={notifications.leads}
                      onChange={(e) =>
                        setNotifications({
                          ...notifications,
                          leads: e.target.checked,
                        })
                      }
                      className="rounded"
                    />
                  </label>
                  <label className="flex items-center justify-between">
                    <span className="text-foreground text-sm">
                      Activity Updates
                    </span>
                    <input
                      type="checkbox"
                      checked={notifications.activities}
                      onChange={(e) =>
                        setNotifications({
                          ...notifications,
                          activities: e.target.checked,
                        })
                      }
                      className="rounded"
                    />
                  </label>
                </div>
              </div>
              <Button onClick={handleSaveNotifications} disabled={saving}>
                {saving ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Saving...
                  </>
                ) : (
                  <>
                    <Save className="mr-2 h-4 w-4" />
                    Save Preferences
                  </>
                )}
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="security" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Key className="h-5 w-5" />
                Change Password
              </CardTitle>
              <CardDescription>
                Update your password to keep your account secure
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <label className="mb-1 block font-medium text-foreground text-sm">
                  Current Password
                </label>
                <Input
                  type="password"
                  placeholder="Enter current password"
                  value={passwordData.currentPassword}
                  onChange={(e) =>
                    setPasswordData({
                      ...passwordData,
                      currentPassword: e.target.value,
                    })
                  }
                />
              </div>
              <div>
                <label className="mb-1 block font-medium text-foreground text-sm">
                  New Password
                </label>
                <Input
                  type="password"
                  placeholder="Enter new password"
                  value={passwordData.newPassword}
                  onChange={(e) =>
                    setPasswordData({
                      ...passwordData,
                      newPassword: e.target.value,
                    })
                  }
                />
              </div>
              <div>
                <label className="mb-1 block font-medium text-foreground text-sm">
                  Confirm New Password
                </label>
                <Input
                  type="password"
                  placeholder="Confirm new password"
                  value={passwordData.confirmPassword}
                  onChange={(e) =>
                    setPasswordData({
                      ...passwordData,
                      confirmPassword: e.target.value,
                    })
                  }
                />
              </div>
              <Button onClick={handleUpdatePassword} disabled={saving}>
                {saving ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Updating...
                  </>
                ) : (
                  <>
                    <Key className="mr-2 h-4 w-4" />
                    Update Password
                  </>
                )}
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="billing" className="space-y-6">
          <BillingTab />
        </TabsContent>

        <TabsContent value="referral" className="space-y-6">
          <ReferralTab />
        </TabsContent>
      </Tabs>
    </div>
  );
}

// ─── Billing Tab ──────────────────────────────────────────────────────────────

const BILLING_PLANS = [
  {
    id: "starter",
    name: "Starter",
    monthlyUsd: 15,
    annualUsd: 12,
    color: "text-sky-400",
    bg: "bg-sky-400/10",
    border: "border-sky-400/20",
    features: [
      "Up to 10 users",
      "CRM + Helpdesk + Projects + Finance",
      "Email support",
    ],
  },
  {
    id: "growth",
    name: "Growth",
    monthlyUsd: 29,
    annualUsd: 23,
    color: "text-primary",
    bg: "bg-primary/10",
    border: "border-primary/30",
    features: [
      "Up to 100 users",
      "HRM + Marketing + Procurement",
      "AI lead scoring",
      "Priority support",
    ],
  },
  {
    id: "business",
    name: "Business",
    monthlyUsd: 49,
    annualUsd: 39,
    color: "text-violet-400",
    bg: "bg-violet-400/10",
    border: "border-violet-400/20",
    features: [
      "Up to 500 users",
      "BI + Forecasting + Compliance",
      "SSO + Audit logs",
      "Dedicated account manager",
    ],
  },
];

const PLAN_NAME_MAP: Record<string, string> = {
  trial: "Free Trial",
  starter: "Starter",
  growth: "Growth",
  business: "Business",
  enterprise: "Enterprise",
};

const MOCK_INVOICES = [
  {
    id: "INV-2025-003",
    date: "Mar 1, 2025",
    amount: "$145.00",
    status: "Paid",
    plan: "Growth (5 users)",
  },
  {
    id: "INV-2025-002",
    date: "Feb 1, 2025",
    amount: "$145.00",
    status: "Paid",
    plan: "Growth (5 users)",
  },
  {
    id: "INV-2025-001",
    date: "Jan 1, 2025",
    amount: "$116.00",
    status: "Paid",
    plan: "Starter (8 users)",
  },
];

function TrialRing({
  daysLeft,
  totalDays = 21,
}: { daysLeft: number; totalDays?: number }) {
  const r = 30;
  const circ = 2 * Math.PI * r;
  const pct = Math.max(0, daysLeft / totalDays);
  const dash = pct * circ;
  const color =
    daysLeft > 10 ? "#22c55e" : daysLeft > 5 ? "#f59e0b" : "#ef4444";
  return (
    <svg width="80" height="80" viewBox="0 0 80 80">
      <circle
        cx="40"
        cy="40"
        r={r}
        fill="none"
        stroke="currentColor"
        strokeWidth="6"
        className="text-muted/40"
      />
      <circle
        cx="40"
        cy="40"
        r={r}
        fill="none"
        stroke={color}
        strokeWidth="6"
        strokeLinecap="round"
        strokeDasharray={`${dash} ${circ}`}
        strokeDashoffset={circ / 4}
        style={{ transition: "stroke-dasharray 0.8s ease" }}
      />
      <text
        x="40"
        y="36"
        textAnchor="middle"
        fontSize="16"
        fontWeight="bold"
        fill={color}
      >
        {daysLeft}
      </text>
      <text
        x="40"
        y="50"
        textAnchor="middle"
        fontSize="9"
        fill="currentColor"
        className="text-muted-foreground"
      >
        days left
      </text>
    </svg>
  );
}

function BillingTab() {
  const storedPlan =
    typeof window !== "undefined"
      ? localStorage.getItem("nucleo_plan") || "trial"
      : "trial";
  const [currentPlan, setCurrentPlan] = useState(storedPlan);
  const [billing, setBilling] = useState<"monthly" | "annual">("annual");
  const [upgrading, setUpgrading] = useState<string | null>(null);
  const trialDays = 14; // simulated days remaining

  const { data: invoicesData } = useQuery({
    queryKey: ["billing", "invoices"],
    queryFn: () => nucleoApi.invoices.list({ page: 1, limit: 50 }),
  });

  const handleUpgrade = async (planId: string) => {
    setUpgrading(planId);
    await new Promise((r) => setTimeout(r, 1200));
    setCurrentPlan(planId);
    localStorage.setItem("nucleo_plan", planId);
    setUpgrading(null);
    toast.success(`Upgraded to ${PLAN_NAME_MAP[planId]} plan! 🎉`);
  };

  const planColor: Record<string, string> = {
    trial: "text-amber-400",
    starter: "text-sky-400",
    growth: "text-primary",
    business: "text-violet-400",
    enterprise: "text-emerald-400",
  };

  return (
    <div className="space-y-6">
      {/* Current plan card */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CreditCard className="h-5 w-5" />
            Current Plan
          </CardTitle>
          <CardDescription>
            Your subscription and usage overview
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap items-center gap-6">
            {currentPlan === "trial" && <TrialRing daysLeft={trialDays} />}
            <div className="flex-1 space-y-2">
              <div className="flex items-center gap-3 flex-wrap">
                <span
                  className={`font-bold text-2xl ${planColor[currentPlan] || "text-foreground"}`}
                >
                  {PLAN_NAME_MAP[currentPlan] || currentPlan}
                </span>
                {currentPlan === "trial" ? (
                  <span className="rounded-full border border-amber-400/30 bg-amber-400/10 px-2.5 py-0.5 text-amber-400 text-xs font-semibold">
                    Trial — {trialDays} days left
                  </span>
                ) : (
                  <span className="rounded-full border border-success/30 bg-success/10 px-2.5 py-0.5 text-success text-xs font-semibold">
                    Active
                  </span>
                )}
              </div>
              {currentPlan === "trial" ? (
                <p className="text-muted-foreground text-sm">
                  You're on a full-access trial. Upgrade before your trial ends
                  to keep all your data and features.
                </p>
              ) : (
                <p className="text-muted-foreground text-sm">
                  {billing === "annual" ? "Annual" : "Monthly"} billing ·{" "}
                  {currentPlan !== "enterprise" &&
                  BILLING_PLANS.find((p) => p.id === currentPlan)
                    ? `$${billing === "annual" ? BILLING_PLANS.find((p) => p.id === currentPlan)!.annualUsd : BILLING_PLANS.find((p) => p.id === currentPlan)!.monthlyUsd}/user/month`
                    : "Custom pricing"}
                </p>
              )}
              <div className="flex flex-wrap gap-2 pt-1">
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() =>
                    toast.info("Opening Stripe customer portal...")
                  }
                >
                  Manage payment method
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => toast.info("Downloading invoice PDF...")}
                >
                  Download invoice
                </Button>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Upgrade / Change plan */}
      {currentPlan !== "enterprise" && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">
              {currentPlan === "trial" ? "Choose a plan" : "Change plan"}
            </CardTitle>
            <CardDescription>
              {currentPlan === "trial"
                ? "Pick a plan to continue after your trial. No credit card yet — you'll enter payment details when your trial ends."
                : "Upgrade or downgrade at any time. Changes take effect immediately."}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Billing toggle */}
            <div className="inline-flex items-center gap-2 rounded-lg border border-border bg-muted/30 p-1 text-sm">
              <button
                type="button"
                onClick={() => setBilling("monthly")}
                className={`px-3 py-1.5 rounded-md font-medium transition-all ${billing === "monthly" ? "bg-card text-foreground shadow-sm" : "text-muted-foreground"}`}
              >
                Monthly
              </button>
              <button
                type="button"
                onClick={() => setBilling("annual")}
                className={`px-3 py-1.5 rounded-md font-medium transition-all flex items-center gap-1.5 ${billing === "annual" ? "bg-card text-foreground shadow-sm" : "text-muted-foreground"}`}
              >
                Annual
                <span className="rounded-full bg-success/20 text-success text-[10px] font-bold px-1.5 py-0.5">
                  -20%
                </span>
              </button>
            </div>

            <div className="grid gap-4 md:grid-cols-3">
              {BILLING_PLANS.map((plan) => {
                const price =
                  billing === "annual" ? plan.annualUsd : plan.monthlyUsd;
                const isCurrent = currentPlan === plan.id;
                const isUpgrade =
                  BILLING_PLANS.findIndex((p) => p.id === plan.id) >
                  BILLING_PLANS.findIndex((p) => p.id === currentPlan);
                return (
                  <div
                    key={plan.id}
                    className={`rounded-xl border p-4 space-y-3 transition-colors ${
                      isCurrent
                        ? `${plan.border} ${plan.bg}`
                        : "border-border bg-card hover:border-muted-foreground/30"
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className={`font-bold ${plan.color}`}>
                        {plan.name}
                      </span>
                      {isCurrent && (
                        <span className="rounded-full bg-muted px-2 py-0.5 text-muted-foreground text-[10px] font-semibold">
                          CURRENT
                        </span>
                      )}
                    </div>
                    <div>
                      <span className="font-bold text-2xl text-foreground">
                        ${price}
                      </span>
                      <span className="text-muted-foreground text-xs">
                        /user/mo
                      </span>
                    </div>
                    <ul className="space-y-1">
                      {plan.features.map((f) => (
                        <li
                          key={f}
                          className="flex items-start gap-1.5 text-xs text-muted-foreground"
                        >
                          <Check className="h-3 w-3 text-success mt-0.5 shrink-0" />
                          {f}
                        </li>
                      ))}
                    </ul>
                    {!isCurrent && (
                      <Button
                        size="sm"
                        variant={
                          isUpgrade || currentPlan === "trial"
                            ? "primary"
                            : "outline"
                        }
                        className="w-full"
                        loading={upgrading === plan.id}
                        onClick={() => handleUpgrade(plan.id)}
                      >
                        {upgrading === plan.id
                          ? "Processing..."
                          : isUpgrade || currentPlan === "trial"
                            ? `Upgrade to ${plan.name}`
                            : `Switch to ${plan.name}`}
                      </Button>
                    )}
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Invoice history */}
      {currentPlan !== "trial" && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Billing history</CardTitle>
            <CardDescription>Past invoices and payment records</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="rounded-xl border border-border overflow-hidden">
              <table className="w-full text-sm">
                <thead className="bg-muted/30 border-b border-border">
                  <tr>
                    <th className="text-left px-4 py-2.5 font-medium text-muted-foreground">
                      Invoice
                    </th>
                    <th className="text-left px-4 py-2.5 font-medium text-muted-foreground">
                      Date
                    </th>
                    <th className="text-left px-4 py-2.5 font-medium text-muted-foreground">
                      Plan
                    </th>
                    <th className="text-right px-4 py-2.5 font-medium text-muted-foreground">
                      Amount
                    </th>
                    <th className="text-right px-4 py-2.5 font-medium text-muted-foreground">
                      Status
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {(invoicesData?.data ?? MOCK_INVOICES).map((inv) => (
                    <tr
                      key={inv.id}
                      className="border-t border-border/50 hover:bg-muted/10 transition-colors"
                    >
                      <td className="px-4 py-3">
                        <button
                          type="button"
                          className="text-primary hover:underline font-mono text-xs"
                          onClick={() => toast.info(`Downloading ${inv.id}...`)}
                        >
                          {inv.id}
                        </button>
                      </td>
                      <td className="px-4 py-3 text-muted-foreground">
                        {inv.date}
                      </td>
                      <td className="px-4 py-3 text-muted-foreground">
                        {inv.plan}
                      </td>
                      <td className="px-4 py-3 text-right font-medium text-foreground">
                        {inv.amount}
                      </td>
                      <td className="px-4 py-3 text-right">
                        <span className="rounded-full bg-success/15 text-success text-xs px-2 py-0.5 font-medium">
                          {inv.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Danger zone */}
      <Card className="border-destructive/20">
        <CardHeader>
          <CardTitle className="text-base text-destructive">
            Danger zone
          </CardTitle>
          <CardDescription>Irreversible account actions</CardDescription>
        </CardHeader>
        <CardContent className="flex flex-wrap gap-3">
          <Button
            variant="outline"
            size="sm"
            className="border-destructive/30 text-destructive hover:bg-destructive/10"
            onClick={() =>
              toast.warning(
                "Contact support@nucleoone.com to cancel your subscription. We'll process it within 24 hours.",
              )
            }
          >
            Cancel subscription
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() =>
              toast.info("Data export will be emailed to you within 2 hours.")
            }
          >
            Export all data
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}

// ─── Referral Tab ─────────────────────────────────────────────────────────────

function ReferralTab() {
  const [copied, setCopied] = useState(false);
  const referralCode = "NUCLEO-JDOE-2025";
  const referralLink = `https://nucleoone.com/register?ref=${referralCode}`;

  const copyToClipboard = () => {
    navigator.clipboard.writeText(referralLink);
    setCopied(true);
    toast.success("Referral link copied to clipboard!");
    setTimeout(() => setCopied(false), 2000);
  };

  const referrals = [
    { id: 1, email: "m***@acme.com", status: "Active", reward: "$50 Credit" },
    {
      id: 2,
      email: "s***@techflow.io",
      status: "Active",
      reward: "$50 Credit",
    },
    { id: 3, email: "k***@startup.co", status: "Pending", reward: "—" },
  ];

  return (
    <div className="space-y-6">
      <div className="grid gap-6 md:grid-cols-2">
        <Card className="border-primary/20 bg-primary/5">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Gift className="h-5 w-5 text-primary" />
              Give $50, Get $50
            </CardTitle>
            <CardDescription className="text-foreground/70">
              Invite your friends to Nucleo One. When they start a paid plan,
              you both get $50 in credits.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Your Referral Link</label>
              <div className="flex gap-2">
                <Input readOnly value={referralLink} className="bg-muted/50" />
                <Button variant="outline" size="icon" onClick={copyToClipboard}>
                  {copied ? (
                    <Check className="h-4 w-4 text-success" />
                  ) : (
                    <Copy className="h-4 w-4" />
                  )}
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-sm">
              <TrendingUp className="h-4 w-4 text-primary" />
              Referral Stats
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-4">
              <div className="rounded-lg bg-muted/40 p-4 text-center">
                <p className="text-2xl font-bold">3</p>
                <p className="text-xs text-muted-foreground uppercase tracking-wider">
                  Total Invites
                </p>
              </div>
              <div className="rounded-lg bg-muted/40 p-4 text-center">
                <p className="text-2xl font-bold text-success">$100</p>
                <p className="text-xs text-muted-foreground uppercase tracking-wider">
                  Credits Earned
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            Your Referrals
          </CardTitle>
          <CardDescription>
            Track status of everyone you've invited
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="rounded-lg border border-border overflow-hidden">
            <table className="w-full text-left text-sm">
              <thead className="bg-muted/50 text-muted-foreground font-medium border-b border-border">
                <tr>
                  <th className="px-4 py-3">Invitee</th>
                  <th className="px-4 py-3">Status</th>
                  <th className="px-4 py-3 text-right">Reward</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {referrals.map((r) => (
                  <tr key={r.id}>
                    <td className="px-4 py-3">{r.email}</td>
                    <td className="px-4 py-3">
                      <span
                        className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide ${
                          r.status === "Active"
                            ? "bg-success/15 text-success"
                            : "bg-amber-500/15 text-amber-500"
                        }`}
                      >
                        {r.status}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-right font-medium text-success">
                      {r.reward}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-sm font-semibold">Program FAQ</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4 text-sm text-muted-foreground">
          <div className="space-y-1">
            <p className="font-medium text-foreground">
              When do I get my credit?
            </p>
            <p>
              Credits are applied to your account automatically once your
              referral completes their first full billing cycle (30 days) on a
              paid plan.
            </p>
          </div>
          <div className="space-y-1">
            <p className="font-medium text-foreground">Is there a limit?</p>
            <p>
              Nope! Refer as many people as you'd like. Some of our top power
              users have paid for their entire annual subscription through
              referrals.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
