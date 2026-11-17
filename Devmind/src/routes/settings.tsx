import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { Bell, Key, LogOut, Save, Shield, User } from "lucide-react";
import { Button } from "../components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "../components/ui/card";
import { Input } from "../components/ui/input";
import { Label } from "../components/ui/label";

// @ts-ignore - route registered separately
export const Route = createFileRoute("/settings")({
  component: SettingsPage,
});

function SettingsPage() {
  const navigate = useNavigate();

  const handleLogout = () => {
    localStorage.removeItem("user");
    navigate({ to: "/" });
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-white">Settings</h1>
        <p className="text-zinc-400 mt-1">
          Manage your account settings and preferences
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-white flex items-center gap-2">
            <User className="w-5 h-5" />
            Profile
          </CardTitle>
          <CardDescription>Update your personal information</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="name">Name</Label>
              <Input id="name" defaultValue="John Doe" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input id="email" defaultValue="john@example.com" type="email" />
            </div>
          </div>
          <Button>
            <Save className="w-4 h-4 mr-2" />
            Save Changes
          </Button>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-white flex items-center gap-2">
            <Key className="w-5 h-5" />
            API Keys
          </CardTitle>
          <CardDescription>
            Manage your API keys for programmatic access
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex items-center justify-between p-4 bg-zinc-900 rounded-lg">
              <div>
                <p className="font-medium text-white">Default Key</p>
                <p className="text-sm text-zinc-400 font-mono">sk-...abc123</p>
              </div>
              <Button variant="outline" size="sm">
                Regenerate
              </Button>
            </div>
            <Button variant="outline" className="w-full">
              <Key className="w-4 h-4 mr-2" />
              Create New Key
            </Button>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-white flex items-center gap-2">
            <Bell className="w-5 h-5" />
            Notifications
          </CardTitle>
          <CardDescription>
            Configure how you receive notifications
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {[
              {
                label: "Email notifications",
                desc: "Receive email updates about your agents",
              },
              {
                label: "Usage alerts",
                desc: "Get notified when approaching usage limits",
              },
              {
                label: "Marketing emails",
                desc: "Receive updates about new features",
              },
            ].map((item) => (
              <div
                key={item.label}
                className="flex items-center justify-between p-4 bg-zinc-900 rounded-lg"
              >
                <div>
                  <p className="font-medium text-white">{item.label}</p>
                  <p className="text-sm text-zinc-400">{item.desc}</p>
                </div>
                <button className="w-11 h-6 bg-violet-600 rounded-full relative">
                  <span className="absolute right-1 top-1 w-4 h-4 bg-white rounded-full transition" />
                </button>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-white flex items-center gap-2">
            <Shield className="w-5 h-5" />
            Security
          </CardTitle>
          <CardDescription>Manage your account security</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex items-center justify-between p-4 bg-zinc-900 rounded-lg">
              <div>
                <p className="font-medium text-white">
                  Two-factor authentication
                </p>
                <p className="text-sm text-zinc-400">
                  Add an extra layer of security
                </p>
              </div>
              <Button variant="outline" size="sm">
                Enable
              </Button>
            </div>
            <div className="flex items-center justify-between p-4 bg-zinc-900 rounded-lg">
              <div>
                <p className="font-medium text-white">Change password</p>
                <p className="text-sm text-zinc-400">
                  Update your password regularly
                </p>
              </div>
              <Button variant="outline" size="sm">
                Change
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card className="border-red-500/20">
        <CardHeader>
          <CardTitle className="text-red-400 flex items-center gap-2">
            <LogOut className="w-5 h-5" />
            Danger Zone
          </CardTitle>
          <CardDescription>Irreversible account actions</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between p-4 bg-red-500/10 border border-red-500/20 rounded-lg">
            <div>
              <p className="font-medium text-white">Delete account</p>
              <p className="text-sm text-zinc-400">
                Permanently delete your account and all data
              </p>
            </div>
            <Button variant="destructive" size="sm">
              Delete
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
