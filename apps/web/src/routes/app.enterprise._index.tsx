/**
 * Enterprise Settings
 *
 * SSO, SAML/OIDC, IP allowlist, audit logs, custom domains, and compliance controls.
 */

import { Badge, Button, Card, CardContent, CardHeader, CardTitle, Input, Loading } from "@crm/ui";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { createFileRoute, Link } from "@tanstack/react-router";
import {
  ExternalLink,
  Fingerprint,
  Globe,
  History,
  KeyRound,
  Lock,
  Shield,
  Users,
} from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

export const Route = createFileRoute("/app/enterprise/_index")({
  component: EnterpriseSettingsPage,
});

const orgHeader = () => ({
  "x-organization-id": localStorage.getItem("activeOrganizationId") ?? "",
  "Content-Type": "application/json",
});

function EnterpriseSettingsPage() {
  const queryClient = useQueryClient();

  const { data, isLoading } = useQuery({
    queryKey: ["enterprise", "settings"],
    queryFn: () =>
      fetch("/api/v1/enterprise/settings", { headers: orgHeader() }).then((r) => r.json()),
  });

  const settings: any = (data as any)?.data ?? data ?? {};

  const [ssoEnabled, setSsoEnabled] = useState<boolean>(settings.ssoEnabled ?? false);
  const [ssoType, setSsoType] = useState<string>(settings.ssoType ?? "saml");
  const [ssoMetadata, setSsoMetadata] = useState<string>(settings.ssoMetadata ?? "");
  const [ipAllowlist, setIpAllowlist] = useState<string>(
    (settings.ipAllowlist ?? []).join("\n"),
  );
  const [customDomain, setCustomDomain] = useState<string>(settings.customDomain ?? "");
  const [gdpr, setGdpr] = useState<boolean>(settings.gdprEnabled ?? false);
  const [soc2, setSoc2] = useState<boolean>(settings.soc2Enabled ?? false);
  const [hipaa, setHipaa] = useState<boolean>(settings.hipaaEnabled ?? false);

  const saveMutation = useMutation({
    mutationFn: async (payload: Record<string, unknown>) => {
      const res = await fetch("/api/v1/enterprise/settings", {
        method: "PUT",
        headers: orgHeader(),
        body: JSON.stringify(payload),
      });
      if (!res.ok) throw new Error("Failed to save settings");
      return res.json() as Promise<any>;
    },
    onSuccess: () => {
      toast.success("Enterprise settings saved");
      queryClient.invalidateQueries({ queryKey: ["enterprise", "settings"] });
    },
    onError: () => toast.error("Failed to save settings"),
  });

  if (isLoading) return <Loading />;

  const teamMembers = settings.teamMembersCount ?? settings.userCount ?? 0;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Enterprise Settings</h1>
        <p className="text-muted-foreground mt-1">
          Advanced security, compliance, and organizational controls
        </p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <Users className="h-5 w-5 text-blue-500" />
              <div>
                <p className="text-sm text-muted-foreground">Team Members</p>
                <p className="text-2xl font-bold">{teamMembers}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <KeyRound className="h-5 w-5 text-green-500" />
              <div>
                <p className="text-sm text-muted-foreground">SSO Status</p>
                <Badge className={ssoEnabled ? "bg-green-100 text-green-700" : "bg-gray-100 text-gray-700"}>
                  {ssoEnabled ? "Enabled" : "Disabled"}
                </Badge>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* SSO Configuration */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <Fingerprint className="h-4 w-4 text-primary" />
            SSO Configuration
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="font-medium text-sm">Enable Single Sign-On</p>
              <p className="text-xs text-muted-foreground">Allow team members to sign in with your identity provider</p>
            </div>
            <button
              onClick={() => setSsoEnabled(!ssoEnabled)}
              className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors focus:outline-none ${ssoEnabled ? "bg-green-500" : "bg-gray-300"}`}
            >
              <span className={`inline-block h-3.5 w-3.5 transform rounded-full bg-white shadow transition-transform ${ssoEnabled ? "translate-x-4" : "translate-x-1"}`} />
            </button>
          </div>
          {ssoEnabled && (
            <div className="space-y-3 pt-2 border-t border-border/50">
              <div>
                <label className="text-xs font-medium text-muted-foreground mb-1 block">Protocol</label>
                <div className="flex gap-2">
                  {["saml", "oidc"].map((type) => (
                    <button
                      key={type}
                      onClick={() => setSsoType(type)}
                      className={`px-3 py-1.5 text-xs font-medium rounded-md uppercase transition-colors ${ssoType === type ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"}`}
                    >
                      {type}
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <label className="text-xs font-medium text-muted-foreground mb-1 block">
                  {ssoType === "saml" ? "Metadata URL or XML" : "OIDC Discovery URL"}
                </label>
                <Input
                  placeholder={ssoType === "saml" ? "https://idp.example.com/metadata" : "https://accounts.example.com/.well-known/openid-configuration"}
                  value={ssoMetadata}
                  onChange={(e) => setSsoMetadata(e.target.value)}
                />
              </div>
              <Button
                size="sm"
                onClick={() => saveMutation.mutate({ ssoEnabled, ssoType, ssoMetadata })}
                disabled={saveMutation.isPending}
              >
                {saveMutation.isPending ? "Saving..." : "Save SSO Config"}
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      {/* IP Allowlist */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <Lock className="h-4 w-4 text-primary" />
            IP Allowlist
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <p className="text-xs text-muted-foreground">
            Restrict access to specific IP addresses or CIDR ranges. One per line.
          </p>
          <textarea
            value={ipAllowlist}
            onChange={(e) => setIpAllowlist(e.target.value)}
            placeholder={"192.168.1.0/24\n10.0.0.1\n203.0.113.0/24"}
            rows={4}
            className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-ring resize-none"
          />
          <Button
            size="sm"
            onClick={() =>
              saveMutation.mutate({
                ipAllowlist: ipAllowlist.split("\n").map((ip) => ip.trim()).filter(Boolean),
              })
            }
            disabled={saveMutation.isPending}
          >
            Save Allowlist
          </Button>
        </CardContent>
      </Card>

      {/* Custom Domains */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <Globe className="h-4 w-4 text-primary" />
            Custom Domain
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <Input
            placeholder="app.yourcompany.com"
            value={customDomain}
            onChange={(e) => setCustomDomain(e.target.value)}
          />
          <Button
            size="sm"
            onClick={() => saveMutation.mutate({ customDomain })}
            disabled={saveMutation.isPending}
          >
            Save Domain
          </Button>
        </CardContent>
      </Card>

      {/* Audit Log */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <History className="h-4 w-4 text-primary" />
            Audit Log
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground mb-3">
            View a full history of security events, user actions, and configuration changes.
          </p>
          <Link to={"/app/enterprise/audit" as any}>
            <Button variant="outline" size="sm" className="gap-1.5">
              <ExternalLink className="h-3.5 w-3.5" />
              View Audit Log
            </Button>
          </Link>
        </CardContent>
      </Card>

      {/* Compliance */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <Shield className="h-4 w-4 text-primary" />
            Compliance
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {[
            { key: "gdpr", label: "GDPR", desc: "EU General Data Protection Regulation", value: gdpr, set: setGdpr },
            { key: "soc2", label: "SOC 2", desc: "Service Organization Control 2", value: soc2, set: setSoc2 },
            { key: "hipaa", label: "HIPAA", desc: "Health Insurance Portability and Accountability Act", value: hipaa, set: setHipaa },
          ].map(({ key, label, desc, value, set }) => (
            <div key={key} className="flex items-center justify-between">
              <div>
                <p className="font-medium text-sm">{label}</p>
                <p className="text-xs text-muted-foreground">{desc}</p>
              </div>
              <button
                onClick={() => set(!value)}
                className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors focus:outline-none ${value ? "bg-green-500" : "bg-gray-300"}`}
              >
                <span className={`inline-block h-3.5 w-3.5 transform rounded-full bg-white shadow transition-transform ${value ? "translate-x-4" : "translate-x-1"}`} />
              </button>
            </div>
          ))}
          <Button
            size="sm"
            onClick={() =>
              saveMutation.mutate({ gdprEnabled: gdpr, soc2Enabled: soc2, hipaaEnabled: hipaa })
            }
            disabled={saveMutation.isPending}
            className="mt-2"
          >
            Save Compliance Settings
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
