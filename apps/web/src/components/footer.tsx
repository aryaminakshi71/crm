/**
 * Shared Footer Component
 * Premium, unified footer for all marketing and static pages.
 */

import { Link } from "@tanstack/react-router";
import { Mail, ShieldCheck, Zap } from "lucide-react";

export function Footer() {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="border-t border-border/60 bg-card py-16">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-2 gap-12 lg:grid-cols-4">
          {/* Brand */}
          <div className="col-span-2 lg:col-span-1">
            <Link
              to="/"
              className="inline-flex items-center gap-2 font-bold text-2xl text-primary mb-6"
            >
              <Zap className="h-6 w-6 fill-primary" />
              Nucleo One
            </Link>
            <p className="text-muted-foreground text-sm leading-relaxed max-w-xs mb-6">
              The first truly unified Enterprise Operating System. One login,
              one data source, unlimited business intelligence.
            </p>
            <div className="flex items-center gap-4">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-muted text-muted-foreground hover:bg-muted/80 transition-colors cursor-pointer">
                <Mail className="h-5 w-5" />
              </div>
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-muted text-muted-foreground hover:bg-muted/80 transition-colors cursor-pointer">
                <ShieldCheck className="h-5 w-5" />
              </div>
            </div>
          </div>

          {/* Product */}
          <div>
            <h3 className="mb-6 font-bold text-foreground text-sm uppercase tracking-widest">
              Platform
            </h3>
            <ul className="space-y-4">
              {[
                { label: "CRM", to: "/app/crm" },
                { label: "Helpdesk", to: "/app/helpdesk" },
                { label: "Projects", to: "/app/projects" },
                { label: "HRM", to: "/app/hrm" },
                { label: "AI Agents", to: "/app/agents" },
              ].map((l) => (
                <li key={l.label}>
                  <Link
                    to={l.to}
                    className="text-muted-foreground text-sm hover:text-primary transition-colors"
                  >
                    {l.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Company */}
          <div>
            <h3 className="mb-6 font-bold text-foreground text-sm uppercase tracking-widest">
              Company
            </h3>
            <ul className="space-y-4">
              {[
                { label: "About", to: "/about" },
                { label: "Pricing", to: "/pricing" },
                { label: "Industries", to: "/industries" },
                { label: "Blog", to: "/blog" },
                { label: "Security", to: "/security" },
              ].map((l) => (
                <li key={l.label}>
                  <Link
                    to={l.to}
                    className="text-muted-foreground text-sm hover:text-primary transition-colors"
                  >
                    {l.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Legal / Resources */}
          <div>
            <h3 className="mb-6 font-bold text-foreground text-sm uppercase tracking-widest">
              Resources
            </h3>
            <ul className="space-y-4">
              {[
                { label: "Documentation", to: "/docs" },
                { label: "API Reference", to: "/docs" },
                { label: "System Status", to: "/status" },
                { label: "Privacy Policy", to: "/privacy" },
                { label: "Terms of Service", to: "/terms" },
              ].map((l) => (
                <li key={l.label}>
                  <Link
                    to={l.to}
                    className="text-muted-foreground text-sm hover:text-primary transition-colors"
                  >
                    {l.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </div>

        <div className="mt-16 flex flex-col items-center justify-between gap-6 border-t border-border/40 pt-8 sm:flex-row">
          <div className="flex flex-col gap-1 items-center sm:items-start text-center sm:text-left">
            <p className="text-muted-foreground text-sm font-medium">
              © {currentYear} Nucleo One. All rights reserved.
            </p>
            <p className="text-muted-foreground/60 text-[10px] uppercase tracking-tighter uppercase font-bold">
              The unified standard for modern business operations.
            </p>
          </div>
          <div className="flex items-center gap-6">
            <div className="text-muted-foreground/40 text-[10px] uppercase tracking-widest font-bold">
              SOC 2 TYPE II
            </div>
            <div className="text-muted-foreground/40 text-[10px] uppercase tracking-widest font-bold">
              HIPAA COMPLIANT
            </div>
            <div className="text-muted-foreground/40 text-[10px] uppercase tracking-widest font-bold">
              GDPR READY
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}
