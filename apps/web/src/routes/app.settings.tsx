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
  CreditCard,
  Key,
  Loader2,
  Save,
  Shield,
  User,
} from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

export const Route = createFileRoute("/app/settings")({
  component: SettingsPage,
});

function SettingsPage() {
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
    // Simulate API call
    await new Promise((resolve) => setTimeout(resolve, 800));
    setSaving(false);
    toast.success("Profile updated successfully");
  };

  const handleSaveOrg = async () => {
    setSaving(true);
    await new Promise((resolve) => setTimeout(resolve, 800));
    setSaving(false);
    toast.success("Organization settings updated");
  };

  const handleSaveNotifications = async () => {
    setSaving(true);
    await new Promise((resolve) => setTimeout(resolve, 800));
    setSaving(false);
    toast.success("Notification preferences saved");
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
    await new Promise((resolve) => setTimeout(resolve, 800));
    setSaving(false);
    toast.success("Password updated successfully");
    setPasswordData({
      currentPassword: "",
      newPassword: "",
      confirmPassword: "",
    });
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-bold text-2xl text-foreground">Settings</h1>
        <p className="text-muted-foreground">
          Manage your account and organization settings
        </p>
      </div>

      <Tabs defaultValue="profile" className="space-y-6">
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
          <Card>
            <CardHeader>
              <CardTitle>Billing Information</CardTitle>
              <CardDescription>
                Manage your subscription and payment methods
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="rounded-lg bg-muted p-4">
                <div className="mb-2 flex items-center justify-between">
                  <span className="font-medium text-foreground">
                    Current Plan
                  </span>
                  <span className="font-semibold text-primary">
                    Professional
                  </span>
                </div>
                <p className="text-muted-foreground text-sm">
                  $29/month - Billed monthly
                </p>
              </div>
              <div className="space-y-2">
                <Button
                  variant="outline"
                  className="w-full"
                  onClick={() =>
                    toast.info("Payment method update coming soon!")
                  }
                >
                  Update Payment Method
                </Button>
                <Button
                  variant="outline"
                  className="w-full"
                  onClick={() => toast.info("Billing history coming soon!")}
                >
                  View Billing History
                </Button>
                <Button
                  variant="outline"
                  className="w-full text-destructive hover:bg-destructive/10 hover:text-destructive"
                  onClick={() =>
                    toast.warning(
                      "Please contact support to cancel your subscription",
                    )
                  }
                >
                  Cancel Subscription
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
