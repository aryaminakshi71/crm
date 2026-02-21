import { Header } from "@/components/header";
import { createFileRoute } from "@tanstack/react-router";
import { Activity } from "lucide-react";

export const Route = createFileRoute("/status")({
  head: () => {
    const baseUrl =
      import.meta.env.VITE_PUBLIC_SITE_URL || "http://localhost:3000";
    const canonical = baseUrl.replace(/\/$/, "") + "/status";
    return {
      meta: [
        { title: "CRM Platform - Status" },
        {
          name: "description",
          content: "System status and uptime information for our CRM platform.",
        },
        { name: "robots", content: "index, follow" },
      ],
      links: [{ rel: "canonical", href: canonical }],
    };
  },
  component: StatusPage,
});

function StatusPage() {
  return (
    <div className="min-h-screen bg-card">
      <Header />

      <section className="bg-gradient-to-b from-primary/5 to-background px-4 py-16 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-4xl text-center">
          <div className="mb-6 inline-flex h-16 w-16 items-center justify-center rounded-full bg-primary/10">
            <Activity className="h-8 w-8 text-primary" />
          </div>
          <h1 className="mb-6 font-bold text-5xl text-foreground">Status</h1>
          <p className="text-muted-foreground">
            Last Updated: February 10, 2026
          </p>
        </div>
      </section>

      <section className="px-4 py-16 sm:px-6 lg:px-8">
        <div className="prose prose-lg mx-auto max-w-4xl">
          <p className="text-foreground">All systems operational.</p>
        </div>
      </section>
    </div>
  );
}
