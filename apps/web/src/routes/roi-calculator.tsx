/**
 * ROI Calculator
 *
 * Interactive calculator showing time and cost savings from using Nucleo One
 * compared to using multiple separate tools.
 */

import { Link, createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import {
  ArrowLeft,
  ArrowRight,
  Calculator,
  Clock,
  DollarSign,
  TrendingUp,
  Users,
  Zap,
} from "lucide-react";

// ─── Route ────────────────────────────────────────────────────────────────────

export const Route = createFileRoute("/roi-calculator")({
  head: () => ({
    meta: [
      { title: "ROI Calculator — Nucleo One" },
      {
        name: "description",
        content:
          "Calculate how much time and money Nucleo One can save your team. See ROI estimates for sales, support, and operations.",
      },
    ],
  }),
  component: ROICalculator,
});

// ─── Types ────────────────────────────────────────────────────────────────────

interface CalculatorInputs {
  teamSize: number;
  monthlyToolSpend: number;
  avgDealValue: number;
  monthlyDeals: number;
  supportTicketsPerMonth: number;
  avgSupportHoursPerTicket: number;
  hourlyRate: number;
}

// ─── Default Values ────────────────────────────────────────────────────────────

const DEFAULT_INPUTS: CalculatorInputs = {
  teamSize: 10,
  monthlyToolSpend: 1500,
  avgDealValue: 5000,
  monthlyDeals: 50,
  supportTicketsPerMonth: 200,
  avgSupportHoursPerTicket: 2,
  hourlyRate: 75,
};

// ─── Savings Calculations ─────────────────────────────────────────────────────

function calculateSavings(inputs: CalculatorInputs) {
  // CRM consolidation savings (estimate based on team size)
  const crmTimeSavingsHours = inputs.teamSize * 0.5 * 4; // 0.5 hrs/week * 4 weeks
  const crmTimeSavingsDollars = crmTimeSavingsHours * inputs.hourlyRate;

  // Tool consolidation savings (estimate: 1-2 tools replaced)
  const toolConsolidationSavings = Math.min(inputs.monthlyToolSpend * 0.15, 300);

  // Sales improvements (conservative estimate)
  const salesTimeSavings = inputs.monthlyDeals * inputs.avgDealValue * 0.05 * 0.08;
  const additionalRevenue = inputs.monthlyDeals * inputs.avgDealValue * 0.05;

  // Support savings (AI triage helps, but results vary)
  const supportTicketsReduced = inputs.supportTicketsPerMonth * 0.15;
  const supportTimeSaved = supportTicketsReduced * inputs.avgSupportHoursPerTicket * 0.15 * inputs.hourlyRate;

  // HR/Finance automation savings (conservative estimate)
  const adminTimeSavings = Math.floor(inputs.teamSize / 10) * 3 * 12 * inputs.hourlyRate;

  return {
    crmTimeSavingsHours,
    crmTimeSavingsDollars,
    toolConsolidationSavings,
    salesTimeSavings,
    additionalRevenue,
    supportTimeSaved,
    adminTimeSavings,
    monthlySavings:
      crmTimeSavingsDollars +
      toolConsolidationSavings +
      salesTimeSavings +
      supportTimeSaved +
      adminTimeSavings +
      additionalRevenue,
    yearlySavings:
      (crmTimeSavingsDollars +
        toolConsolidationSavings +
        salesTimeSavings +
        supportTimeSaved +
        adminTimeSavings +
        additionalRevenue) *
      12,
    paybackMonths: Math.ceil((inputs.monthlyToolSpend * 3) /
      ((crmTimeSavingsDollars +
        toolConsolidationSavings +
        salesTimeSavings +
        supportTimeSaved +
        adminTimeSavings +
        additionalRevenue) || 1)),
  };
}

// ─── Component ────────────────────────────────────────────────────────────────

function ROICalculator() {
  const [inputs, setInputs] = useState<CalculatorInputs>(DEFAULT_INPUTS);
  const [showBreakdown, setShowBreakdown] = useState(false);

  const savings = calculateSavings(inputs);

  const handleInputChange = (key: keyof CalculatorInputs, value: number) => {
    setInputs((prev) => ({ ...prev, [key]: value }));
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
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-5xl px-4 py-12 sm:px-6 lg:px-8">
        {/* Hero */}
        <div className="mb-12 text-center">
          <div className="mb-4 inline-flex h-14 w-14 items-center justify-center rounded-2xl bg-primary/10">
            <Calculator className="h-7 w-7 text-primary" />
          </div>
          <h1 className="mb-4 font-bold text-4xl text-foreground sm:text-5xl">
            Calculate Your ROI with Nucleo One
          </h1>
          <p className="mx-auto max-w-2xl text-lg text-muted-foreground">
            See how much time and money your team can save by consolidating CRM,
            HRM, Finance, Helpdesk, and more into one unified platform.
          </p>
        </div>

        <div className="grid gap-8 lg:grid-cols-2">
          {/* Input Section */}
          <div className="rounded-2xl border border-border/60 bg-card p-6">
            <h2 className="mb-6 flex items-center gap-2 font-bold text-xl text-foreground">
              <Users className="h-5 w-5 text-primary" />
              Your Team Details
            </h2>

            <div className="space-y-5">
              <div>
                <label className="mb-2 block text-sm font-medium text-foreground">
                  Team Size
                </label>
                <input
                  type="number"
                  min="1"
                  max="1000"
                  value={inputs.teamSize}
                  onChange={(e) =>
                    handleInputChange("teamSize", parseInt(e.target.value) || 1)
                  }
                  className="w-full rounded-lg border border-input bg-background px-4 py-2.5 text-foreground focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
                />
              </div>

              <div>
                <label className="mb-2 block text-sm font-medium text-foreground">
                  Monthly Spending on Current Tools ($)
                </label>
                <input
                  type="number"
                  min="0"
                  max="100000"
                  value={inputs.monthlyToolSpend}
                  onChange={(e) =>
                    handleInputChange("monthlyToolSpend", parseInt(e.target.value) || 0)
                  }
                  className="w-full rounded-lg border border-input bg-background px-4 py-2.5 text-foreground focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
                />
              </div>

              <div>
                <label className="mb-2 block text-sm font-medium text-foreground">
                  Average Deal Value ($)
                </label>
                <input
                  type="number"
                  min="0"
                  max="10000000"
                  value={inputs.avgDealValue}
                  onChange={(e) =>
                    handleInputChange("avgDealValue", parseInt(e.target.value) || 0)
                  }
                  className="w-full rounded-lg border border-input bg-background px-4 py-2.5 text-foreground focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
                />
              </div>

              <div>
                <label className="mb-2 block text-sm font-medium text-foreground">
                  Deals Closed per Month
                </label>
                <input
                  type="number"
                  min="0"
                  max="10000"
                  value={inputs.monthlyDeals}
                  onChange={(e) =>
                    handleInputChange("monthlyDeals", parseInt(e.target.value) || 0)
                  }
                  className="w-full rounded-lg border border-input bg-background px-4 py-2.5 text-foreground focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
                />
              </div>

              <div>
                <label className="mb-2 block text-sm font-medium text-foreground">
                  Support Tickets per Month
                </label>
                <input
                  type="number"
                  min="0"
                  max="100000"
                  value={inputs.supportTicketsPerMonth}
                  onChange={(e) =>
                    handleInputChange(
                      "supportTicketsPerMonth",
                      parseInt(e.target.value) || 0
                    )
                  }
                  className="w-full rounded-lg border border-input bg-background px-4 py-2.5 text-foreground focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
                />
              </div>

              <div>
                <label className="mb-2 block text-sm font-medium text-foreground">
                  Avg Hours per Support Ticket
                </label>
                <input
                  type="number"
                  min="0"
                  max="100"
                  step="0.5"
                  value={inputs.avgSupportHoursPerTicket}
                  onChange={(e) =>
                    handleInputChange(
                      "avgSupportHoursPerTicket",
                      parseFloat(e.target.value) || 0
                    )
                  }
                  className="w-full rounded-lg border border-input bg-background px-4 py-2.5 text-foreground focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
                />
              </div>

              <div>
                <label className="mb-2 block text-sm font-medium text-foreground">
                  Average Hourly Rate ($)
                </label>
                <input
                  type="number"
                  min="0"
                  max="1000"
                  value={inputs.hourlyRate}
                  onChange={(e) =>
                    handleInputChange("hourlyRate", parseInt(e.target.value) || 0)
                  }
                  className="w-full rounded-lg border border-input bg-background px-4 py-2.5 text-foreground focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
                />
              </div>
            </div>
          </div>

          {/* Results Section */}
          <div className="space-y-6">
            {/* Main Savings Card */}
            <div className="rounded-2xl border-2 border-primary bg-gradient-to-br from-primary/5 to-primary/10 p-8">
              <div className="mb-6 text-center">
                <p className="mb-2 text-muted-foreground text-sm font-medium uppercase tracking-wider">
                  Your Estimated Annual Savings
                </p>
                <p className="font-bold text-5xl text-primary">
                  ${Math.round(savings.yearlySavings).toLocaleString()}
                </p>
                <p className="mt-2 text-muted-foreground">
                  ${Math.round(savings.monthlySavings).toLocaleString()}/month equivalent
                </p>
              </div>

              <div className="grid grid-cols-3 gap-4 text-center">
                <div className="rounded-lg bg-background/60 p-3">
                  <p className="font-bold text-2xl text-foreground">
                    {savings.paybackMonths}
                  </p>
                  <p className="text-xs text-muted-foreground">Months to ROI</p>
                </div>
                <div className="rounded-lg bg-background/60 p-3">
                  <p className="font-bold text-2xl text-foreground">
                    {Math.round(savings.crmTimeSavingsHours)}h
                  </p>
                  <p className="text-xs text-muted-foreground">Hours Saved/Year</p>
                </div>
                <div className="rounded-lg bg-background/60 p-3">
                  <p className="font-bold text-2xl text-foreground">
                    {(savings.yearlySavings / (inputs.monthlyToolSpend * 12) * 100).toFixed(0)}%
                  </p>
                  <p className="text-xs text-muted-foreground">ROI</p>
                </div>
              </div>
            </div>

            {/* Breakdown Toggle */}
            <button
              onClick={() => setShowBreakdown(!showBreakdown)}
              className="w-full rounded-lg border border-border/60 bg-card p-4 text-left font-semibold text-foreground hover:bg-muted/50 transition-colors"
            >
              <span className="flex items-center justify-between">
                View Detailed Breakdown
                <ArrowRight
                  className={`h-5 w-5 transition-transform ${showBreakdown ? "rotate-90" : ""}`}
                />
              </span>
            </button>

            {/* Breakdown Details */}
            {showBreakdown && (
              <div className="rounded-2xl border border-border/60 bg-card p-6 space-y-4">
                <h3 className="font-bold text-lg text-foreground">
                  Savings Breakdown
                </h3>

                <div className="space-y-3">
                  <div className="flex items-center justify-between py-2 border-b border-border/40">
                    <div className="flex items-center gap-3">
                      <div className="h-8 w-8 rounded-lg bg-blue-500/10 flex items-center justify-center">
                        <TrendingUp className="h-4 w-4 text-blue-500" />
                      </div>
                      <div>
                        <p className="font-medium text-foreground">Sales Efficiency</p>
                        <p className="text-xs text-muted-foreground">
                          Improved deal tracking and follow-ups
                        </p>
                      </div>
                    </div>
                    <p className="font-bold text-success">
                      +${Math.round(savings.salesTimeSavings * 12).toLocaleString()}/yr
                    </p>
                  </div>

                  <div className="flex items-center justify-between py-2 border-b border-border/40">
                    <div className="flex items-center gap-3">
                      <div className="h-8 w-8 rounded-lg bg-green-500/10 flex items-center justify-center">
                        <DollarSign className="h-4 w-4 text-green-500" />
                      </div>
                      <div>
                        <p className="font-medium text-foreground">Tool Consolidation</p>
                        <p className="text-xs text-muted-foreground">
                          Replace your tools with one platform
                        </p>
                      </div>
                    </div>
                    <p className="font-bold text-success">
                      +${Math.round(savings.toolConsolidationSavings * 12).toLocaleString()}/yr
                    </p>
                  </div>

                  <div className="flex items-center justify-between py-2 border-b border-border/40">
                    <div className="flex items-center gap-3">
                      <div className="h-8 w-8 rounded-lg bg-purple-500/10 flex items-center justify-center">
                        <Clock className="h-4 w-4 text-purple-500" />
                      </div>
                      <div>
                        <p className="font-medium text-foreground">Support Automation</p>
                        <p className="text-xs text-muted-foreground">
                          AI triage helps route and prioritize tickets
                        </p>
                      </div>
                    </div>
                    <p className="font-bold text-success">
                      +${Math.round(savings.supportTimeSaved * 12).toLocaleString()}/yr
                    </p>
                  </div>

                  <div className="flex items-center justify-between py-2 border-b border-border/40">
                    <div className="flex items-center gap-3">
                      <div className="h-8 w-8 rounded-lg bg-amber-500/10 flex items-center justify-center">
                        <Users className="h-4 w-4 text-amber-500" />
                      </div>
                      <div>
                        <p className="font-medium text-foreground">Admin Automation</p>
                        <p className="text-xs text-muted-foreground">
                          HR & Finance tasks streamlined
                        </p>
                      </div>
                    </div>
                    <p className="font-bold text-success">
                      +${Math.round(savings.adminTimeSavings).toLocaleString()}/yr
                    </p>
                  </div>

                  <div className="flex items-center justify-between py-2">
                    <div className="flex items-center gap-3">
                      <div className="h-8 w-8 rounded-lg bg-cyan-500/10 flex items-center justify-center">
                        <Zap className="h-4 w-4 text-cyan-500" />
                      </div>
                      <div>
                        <p className="font-medium text-foreground">CRM Time Savings</p>
                        <p className="text-xs text-muted-foreground">
                          {Math.round(savings.crmTimeSavingsHours)} hours/year
                        </p>
                      </div>
                    </div>
                    <p className="font-bold text-success">
                      +${Math.round(savings.crmTimeSavingsDollars * 12).toLocaleString()}/yr
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* CTA */}
            <div className="rounded-2xl border border-border/60 bg-card p-6">
              <h3 className="mb-2 font-bold text-lg text-foreground">
                Ready to see these savings in your business?
              </h3>
              <p className="mb-4 text-muted-foreground text-sm">
                Start your 14-day free trial. No credit card required.
              </p>
              <div className="flex flex-col gap-3 sm:flex-row">
                <Link
                  to="/register"
                  className="inline-flex items-center justify-center gap-2 rounded-xl bg-primary px-6 py-3 font-semibold text-primary-foreground hover:bg-primary/90 transition-colors"
                >
                  Start Free Trial
                  <ArrowRight className="h-4 w-4" />
                </Link>
                <Link
                  to="/contact"
                  className="inline-flex items-center justify-center gap-2 rounded-xl border border-border px-6 py-3 font-semibold text-foreground hover:bg-muted transition-colors"
                >
                  Talk to Sales
                </Link>
              </div>
            </div>
          </div>
        </div>

        {/* Trust Signals */}
        <div className="mt-12 rounded-2xl border border-border/60 bg-card/30 p-8">
          <h3 className="mb-6 text-center font-bold text-lg text-foreground">
            Why teams switch to Nucleo One
          </h3>
          <div className="grid gap-6 sm:grid-cols-3">
            <div className="text-center">
              <p className="mb-2 font-bold text-3xl text-primary">—</p>
              <p className="text-muted-foreground text-sm">
                Time saved per week on admin tasks
              </p>
            </div>
            <div className="text-center">
              <p className="mb-2 font-bold text-3xl text-primary">—</p>
              <p className="text-muted-foreground text-sm">
                Reduction in support ticket handling time
              </p>
            </div>
            <div className="text-center">
              <p className="mb-2 font-bold text-3xl text-primary">—</p>
              <p className="text-muted-foreground text-sm">
                Average payback period on Nucleo One investment
              </p>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
