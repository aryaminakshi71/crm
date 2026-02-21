import { Header } from "@/components/header";
import { createFileRoute } from "@tanstack/react-router";
import { ShieldCheck } from "lucide-react";

export const Route = createFileRoute("/security")({
  head: () => {
    const baseUrl =
      import.meta.env.VITE_PUBLIC_SITE_URL || "http://localhost:3000";
    const canonical = baseUrl.replace(/\/$/, "") + "/security";
    return {
      meta: [
        { title: "CRM Platform - Security" },
        {
          name: "description",
          content:
            "Security information and responsible disclosure for our CRM platform.",
        },
        { name: "robots", content: "index, follow" },
      ],
      links: [{ rel: "canonical", href: canonical }],
    };
  },
  component: SecurityPage,
});

function SecurityPage() {
  return (
    <div className="min-h-screen bg-card">
      <Header />

      <section className="bg-gradient-to-b from-primary/5 to-background px-4 py-16 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-4xl text-center">
          <div className="mb-6 inline-flex h-16 w-16 items-center justify-center rounded-full bg-primary/10">
            <ShieldCheck className="h-8 w-8 text-primary" />
          </div>
          <h1 className="mb-6 font-bold text-5xl text-foreground">Security</h1>
          <p className="text-muted-foreground">
            Last Updated: February 10, 2026
          </p>
        </div>
      </section>

      <section className="px-4 py-16 sm:px-6 lg:px-8">
        <div className="prose prose-lg mx-auto max-w-4xl">
          <p className="text-foreground">
            If you believe you have found a vulnerability, please report it
            responsibly. Avoid accessing or modifying data that does not belong
            to you.
          </p>
          <h2 className="font-bold text-2xl text-foreground">
            Responsible Disclosure
          </h2>
          <p className="text-foreground">
            Send a report with steps to reproduce and the impacted area. We will
            investigate and respond as quickly as possible.
          </p>
          <h2 className="font-bold text-2xl text-foreground">Contact</h2>
          <p className="text-foreground">
            Email security@crm.app with details.
          </p>
        </div>
      </section>
    </div>
  );
}
