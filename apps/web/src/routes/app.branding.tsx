import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";

export const Route = createFileRoute("/app/branding")({
  component: BrandingPage,
});

const DEFAULTS = { brandName: "NucleoAI", logoUrl: "", primaryColor: "#6366f1", supportEmail: "", customDomain: "" };

function BrandingPage() {
  const [b, setB] = useState(DEFAULTS);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");

  useEffect(() => {
    fetch("/api/rpc/branding/get", { credentials: "include" })
      .then((r) => (r.ok ? r.json() : null))
      .then((d: any) => {
        const v = d?.json ?? d;
        if (v) setB({ ...DEFAULTS, ...v, logoUrl: v.logoUrl ?? "", supportEmail: v.supportEmail ?? "", customDomain: v.customDomain ?? "" });
      })
      .catch(() => {});
  }, []);

  const save = async () => {
    setSaving(true); setMessage("");
    try {
      const res = await fetch("/api/rpc/branding/update", {
        method: "PUT", headers: { "Content-Type": "application/json" }, credentials: "include",
        body: JSON.stringify({ json: { brandName: b.brandName, logoUrl: b.logoUrl || null, primaryColor: b.primaryColor, supportEmail: b.supportEmail || null, customDomain: b.customDomain || null } }),
      });
      const d: any = await res.json().catch(() => null);
      setMessage(res.ok ? "Branding saved" : d?.message || "Failed to save");
    } catch { setMessage("Failed to save"); } finally { setSaving(false); }
  };

  const field = (label: string, key: keyof typeof DEFAULTS, type = "text") => (
    <label className="block text-sm">
      <span className="mb-1 block font-medium text-foreground">{label}</span>
      <input type={type} value={(b as any)[key]} onChange={(e) => setB({ ...b, [key]: e.target.value })} className="w-full rounded-lg border border-border bg-background px-3 py-2" />
    </label>
  );

  return (
    <div className="space-y-5 p-6">
      <div>
        <h1 className="font-bold text-3xl text-foreground">White-label branding</h1>
        <p className="mt-1 text-muted-foreground">Resell NucleoAI under your own brand.</p>
      </div>
      {message && <div className="rounded-lg border border-blue-200 bg-blue-50 px-4 py-3 text-blue-800">{message}</div>}
      <div className="grid gap-4 rounded-xl border border-border bg-card p-6 md:grid-cols-2">
        {field("Brand name", "brandName")}
        {field("Logo URL", "logoUrl")}
        {field("Primary color", "primaryColor")}
        {field("Support email", "supportEmail", "email")}
        {field("Custom domain", "customDomain")}
        <div className="md:col-span-2">
          <button onClick={save} disabled={saving} className="rounded-lg bg-primary px-4 py-2 font-medium text-primary-foreground hover:bg-primary/90 disabled:opacity-50">{saving ? "Saving…" : "Save branding"}</button>
        </div>
      </div>
    </div>
  );
}
