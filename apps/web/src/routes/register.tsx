/**
 * Register Page — Nucleo One
 * Split-panel design: social proof left, form right
 */
import { authClient } from "@/lib/auth-client";
import {
  Link,
  createFileRoute,
  useNavigate,
  useRouter,
} from "@tanstack/react-router";
import {
  ArrowRight,
  BarChart3,
  Bot,
  Check,
  Globe,
  Lock,
  Mail,
  Shield,
  User,
  Zap,
} from "lucide-react";
import { useState } from "react";

async function notifyWeavebridgeOfSignup(data: {
  email: string;
  name?: string;
  sourceApp: string;
}) {
  try {
    const webhookUrl =
      import.meta.env.VITE_WEBHOOK_URL || "http://localhost:8787";
    await fetch(`${webhookUrl}/api/webhooks/ingest`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        source: data.sourceApp,
        type: "user.signup",
        data: {
          email: data.email,
          name: data.name,
          signedUpAt: new Date().toISOString(),
        },
      }),
    });
  } catch (e) {
    console.error("Webhook notification failed:", e);
  }
}

export const Route = createFileRoute("/register")({
  head: () => {
    const baseUrl =
      import.meta.env.VITE_PUBLIC_SITE_URL || "http://localhost:3001";
    const canonical = baseUrl.replace(/\/$/, "") + "/register";
    return {
      meta: [
        { title: "Start Free Trial — Nucleo One" },
        {
          name: "description",
          content:
            "Start your 21-day free trial of Nucleo One. No credit card required. Full access to CRM, HRM, Projects, Marketing, Helpdesk, Finance, and AI.",
        },
        { name: "robots", content: "noindex, nofollow" },
      ],
      links: [{ rel: "canonical", href: canonical }],
    };
  },
  component: RegisterPage,
});

// ─── Social proof data ────────────────────────────────────────────────────────

const MODULES = [
  { icon: BarChart3, label: "CRM + Deals pipeline", color: "text-sky-400" },
  { icon: Bot, label: "AI lead scoring & forecasting", color: "text-primary" },
  { icon: Globe, label: "Marketing & campaigns", color: "text-violet-400" },
  {
    icon: Shield,
    label: "HRM + Helpdesk + Finance",
    color: "text-emerald-400",
  },
];

const TRIAL_PERKS = [
  "21 days free — no credit card",
  "Full Growth plan access from day one",
  "Your data stays yours, always",
  "Cancel or downgrade anytime",
];

const TESTIMONIALS = [
  {
    quote:
      "We replaced Zoho + Jira + Freshdesk with Nucleo One. Saved $2,400/month.",
    name: "Rohan M.",
    role: "CTO, Series A startup",
    initials: "RM",
    color: "bg-sky-500",
  },
  {
    quote: "The AI deal scoring alone paid for itself in the first month.",
    name: "Sarah K.",
    role: "VP Sales, D2C Brand",
    initials: "SK",
    color: "bg-violet-500",
  },
];

// ─── Page ─────────────────────────────────────────────────────────────────────

function RegisterPage() {
  const navigate = useNavigate();
  const router = useRouter();
  const searchParams = new URLSearchParams(router.state.location.search as any);
  const redirect = searchParams.get("redirect") || undefined;
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setIsLoading(true);
    try {
      const result = await authClient.signUp.email({ email, password, name });
      if (result.error) {
        setError(result.error.message || "Registration failed");
        setIsLoading(false);
        return;
      }
      localStorage.removeItem("demo_mode");
      localStorage.removeItem("isDemo");
      localStorage.removeItem("user");
      localStorage.removeItem("accessToken");
      localStorage.removeItem("companyId");
      // Set trial start
      localStorage.setItem("trial_start", new Date().toISOString());
      localStorage.setItem("nucleo_plan", "trial");
      await notifyWeavebridgeOfSignup({ email, name, sourceApp: "crm" });
      navigate({ to: redirect || "/app" });
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "An error occurred. Please try again.",
      );
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen bg-card">
      {/* ── Left panel: Social proof ── */}
      <div className="hidden lg:flex lg:w-[480px] xl:w-[540px] flex-col justify-between bg-gradient-to-br from-card via-muted/20 to-primary/10 border-r border-border p-10">
        <div>
          <Link to="/" className="flex items-center gap-2.5">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/20">
              <Zap className="h-4 w-4 text-primary" />
            </div>
            <span className="font-bold text-foreground text-lg">
              Nucleo One
            </span>
          </Link>

          <div className="mt-12 space-y-2">
            <div className="inline-flex items-center gap-2 rounded-full bg-success/10 border border-success/20 px-3 py-1 text-success text-xs font-medium">
              <span className="h-1.5 w-1.5 rounded-full bg-success animate-pulse" />
              21-day free trial · No credit card
            </div>
            <h2 className="font-bold text-3xl text-foreground leading-tight">
              One platform.
              <br />
              <span className="bg-gradient-to-r from-primary to-violet-400 bg-clip-text text-transparent">
                Seven tools replaced.
              </span>
            </h2>
            <p className="text-muted-foreground mt-2">
              CRM, HRM, Projects, Marketing, Helpdesk, Finance, and AI — all in
              one workspace. Stop switching tabs.
            </p>
          </div>

          {/* Module pills */}
          <div className="mt-8 grid grid-cols-2 gap-3">
            {MODULES.map((m) => (
              <div
                key={m.label}
                className="flex items-center gap-2.5 rounded-xl border border-border bg-card/60 px-3 py-2.5"
              >
                <m.icon className={`h-4 w-4 shrink-0 ${m.color}`} />
                <span className="text-foreground text-sm">{m.label}</span>
              </div>
            ))}
          </div>

          {/* Trial perks */}
          <ul className="mt-8 space-y-2.5">
            {TRIAL_PERKS.map((perk) => (
              <li
                key={perk}
                className="flex items-center gap-2.5 text-sm text-foreground"
              >
                <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-success/15">
                  <Check className="h-3 w-3 text-success" />
                </span>
                {perk}
              </li>
            ))}
          </ul>
        </div>

        {/* Testimonials */}
        <div className="space-y-3 mt-10">
          {TESTIMONIALS.map((t) => (
            <div
              key={t.name}
              className="rounded-xl border border-border bg-card/60 p-4"
            >
              <p className="text-sm text-foreground italic">"{t.quote}"</p>
              <div className="mt-3 flex items-center gap-2.5">
                <div
                  className={`flex h-7 w-7 items-center justify-center rounded-full text-white text-xs font-bold ${t.color}`}
                >
                  {t.initials}
                </div>
                <div>
                  <p className="font-medium text-foreground text-xs">
                    {t.name}
                  </p>
                  <p className="text-muted-foreground text-[11px]">{t.role}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* ── Right panel: Form ── */}
      <div className="flex flex-1 flex-col items-center justify-center px-6 py-12 sm:px-10">
        <div className="w-full max-w-md space-y-8">
          {/* Mobile logo */}
          <div className="lg:hidden flex justify-center">
            <Link to="/" className="flex items-center gap-2">
              <Zap className="h-5 w-5 text-primary" />
              <span className="font-bold text-foreground text-lg">
                Nucleo One
              </span>
            </Link>
          </div>

          <div className="text-center lg:text-left">
            <h1 className="font-bold text-2xl text-foreground">
              Start your free trial
            </h1>
            <p className="mt-1.5 text-muted-foreground text-sm">
              21 days free · No credit card · Full Growth access
            </p>
          </div>

          {error && (
            <div className="rounded-lg border border-destructive/30 bg-destructive/10 px-4 py-3 text-destructive text-sm">
              {error}
            </div>
          )}

          <form className="space-y-4" onSubmit={handleSubmit}>
            {/* Name */}
            <div>
              <label
                htmlFor="name"
                className="block font-medium text-foreground text-sm mb-1.5"
              >
                Full name
              </label>
              <div className="relative">
                <User className="absolute top-3 left-3 h-4 w-4 text-muted-foreground" />
                <input
                  id="name"
                  name="name"
                  type="text"
                  autoComplete="name"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="block w-full rounded-lg border border-border bg-muted/30 py-2.5 pr-3 pl-9 text-foreground placeholder-muted-foreground focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary text-sm"
                  placeholder="Jane Smith"
                />
              </div>
            </div>

            {/* Email */}
            <div>
              <label
                htmlFor="email"
                className="block font-medium text-foreground text-sm mb-1.5"
              >
                Work email
              </label>
              <div className="relative">
                <Mail className="absolute top-3 left-3 h-4 w-4 text-muted-foreground" />
                <input
                  id="email"
                  name="email"
                  type="email"
                  autoComplete="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="block w-full rounded-lg border border-border bg-muted/30 py-2.5 pr-3 pl-9 text-foreground placeholder-muted-foreground focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary text-sm"
                  placeholder="jane@company.com"
                />
              </div>
            </div>

            {/* Password */}
            <div>
              <label
                htmlFor="password"
                className="block font-medium text-foreground text-sm mb-1.5"
              >
                Password
              </label>
              <div className="relative">
                <Lock className="absolute top-3 left-3 h-4 w-4 text-muted-foreground" />
                <input
                  id="password"
                  name="password"
                  type="password"
                  autoComplete="new-password"
                  required
                  minLength={8}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="block w-full rounded-lg border border-border bg-muted/30 py-2.5 pr-3 pl-9 text-foreground placeholder-muted-foreground focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary text-sm"
                  placeholder="Min. 8 characters"
                />
              </div>
            </div>

            {/* Submit */}
            <button
              type="submit"
              disabled={isLoading}
              className="flex w-full items-center justify-center gap-2 rounded-lg bg-primary px-4 py-3 font-semibold text-primary-foreground shadow-lg shadow-primary/20 hover:bg-primary/90 focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 disabled:opacity-50 transition-all text-sm mt-2"
            >
              {isLoading ? (
                <>
                  <div className="h-4 w-4 animate-spin rounded-full border-2 border-primary-foreground/30 border-t-primary-foreground" />
                  Creating your workspace...
                </>
              ) : (
                <>
                  Start free trial
                  <ArrowRight className="h-4 w-4" />
                </>
              )}
            </button>

            <p className="text-center text-muted-foreground text-xs">
              By signing up, you agree to our{" "}
              <Link to="/terms" className="text-primary hover:underline">
                Terms
              </Link>{" "}
              and{" "}
              <Link to="/privacy" className="text-primary hover:underline">
                Privacy Policy
              </Link>
              .
            </p>
          </form>

          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-border" />
            </div>
            <div className="relative flex justify-center text-xs">
              <span className="bg-card px-3 text-muted-foreground">or</span>
            </div>
          </div>

          <Link
            to="/demo"
            className="flex w-full items-center justify-center gap-2 rounded-lg border border-border bg-card px-4 py-2.5 font-medium text-foreground text-sm hover:bg-muted transition-colors"
          >
            Explore demo instead
          </Link>

          <p className="text-center text-muted-foreground text-sm">
            Already have an account?{" "}
            <Link
              to="/login"
              className="font-medium text-primary hover:underline"
            >
              Sign in
            </Link>
          </p>

          {/* Trust signals */}
          <div className="flex items-center justify-center gap-4 pt-2">
            {[
              { icon: Shield, label: "SOC 2 in progress" },
              { icon: Lock, label: "256-bit SSL" },
              { icon: Globe, label: "US company" },
            ].map((item) => (
              <div
                key={item.label}
                className="flex items-center gap-1 text-muted-foreground text-xs"
              >
                <item.icon className="h-3 w-3" />
                {item.label}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
