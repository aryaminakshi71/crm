import { Link, createFileRoute, useNavigate } from "@tanstack/react-router";
import { ArrowRight, Check } from "lucide-react";

export const Route = createFileRoute("/demo")({
  head: () => {
    const baseUrl =
      import.meta.env.VITE_PUBLIC_SITE_URL || "http://localhost:3001";
    const canonical = baseUrl.replace(/\/$/, "") + "/demo";
    return {
      meta: [
        { title: "Nucleo One - Demo" },
        {
          name: "description",
          content:
            "Modern Nucleo One platform for managing customer relationships, sales pipelines, and business operations. Streamline your sales process and grow your business.",
        },
        { name: "robots", content: "index, follow" },
        { property: "og:title", content: "Nucleo One - Demo" },
        {
          property: "og:description",
          content:
            "Modern Nucleo One platform for managing customer relationships, sales pipelines, and business operations. Streamline your sales process and grow your business.",
        },
        { property: "og:type", content: "website" },
        { name: "twitter:card", content: "summary_large_image" },
        { name: "twitter:title", content: "Nucleo One - Demo" },
        {
          name: "twitter:description",
          content:
            "Modern Nucleo One platform for managing customer relationships, sales pipelines, and business operations. Streamline your sales process and grow your business.",
        },
      ],
      links: [{ rel: "canonical", href: canonical }],
    };
  },

  component: DemoPage,
});

function DemoPage() {
  const navigate = useNavigate();

  const handleStartDemo = () => {
    const demoUserData = {
      id: "demo-user-" + Date.now(),
      email: "demo@nucleo.one",
      name: "Demo User",
      firstName: "Demo",
      lastName: "User",
      role: "admin",
      companyId: "demo-company",
      isDemo: true,
      createdAt: new Date().toISOString(),
    };
    localStorage.setItem("user", JSON.stringify(demoUserData));
    localStorage.setItem("isDemo", "true");
    localStorage.setItem("demo_mode", "true");
    localStorage.setItem("accessToken", "demo-token");
    localStorage.setItem("companyId", "demo-company");
    navigate({ to: "/app" });
  };

  const features = [
    "Full access to all features",
    "Sample data pre-loaded",
    "No credit card required",
    "Explore the complete platform",
    "Test all CRM capabilities",
  ];

  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-primary/5 to-primary/10 px-4 py-12 sm:px-6 lg:px-8">
      <div className="w-full max-w-2xl">
        <div className="rounded-2xl bg-card p-8 shadow-xl md:p-12">
          <div className="mb-8 text-center">
            <h1 className="mb-4 font-bold text-4xl text-foreground">
              Try Nucleo One Demo
            </h1>
            <p className="text-muted-foreground text-xl">
              Experience the full power of our platform with sample data
            </p>
          </div>

          <div className="mb-8">
            <h2 className="mb-4 font-semibold text-2xl text-foreground">
              What You'll Get
            </h2>
            <ul className="space-y-3">
              {features.map((feature, idx) => (
                <li key={idx} className="flex items-center gap-3">
                  <Check className="h-6 w-6 flex-shrink-0 text-success" />
                  <span className="text-foreground">{feature}</span>
                </li>
              ))}
            </ul>
          </div>

          <div className="mb-8 rounded-lg border border-primary/20 bg-primary/5 p-6">
            <h3 className="mb-2 font-semibold text-foreground">
              Demo Account Includes:
            </h3>
            <ul className="space-y-2 text-foreground">
              <li>• Sample contacts, deals, and leads</li>
              <li>• Pre-configured sales pipeline</li>
              <li>• Example email campaigns</li>
              <li>• Analytics dashboard with sample data</li>
            </ul>
          </div>

          <div className="flex flex-col gap-4 sm:flex-row">
            <button
              onClick={handleStartDemo}
              className="flex flex-1 items-center justify-center gap-2 rounded-lg bg-primary px-8 py-4 font-semibold text-lg text-primary-foreground transition-colors hover:bg-primary/90"
            >
              Start Demo
              <ArrowRight className="h-5 w-5" />
            </button>
            <Link
              to="/register"
              className="flex-1 rounded-lg border-2 border-border px-8 py-4 text-center font-semibold text-foreground text-lg transition-colors hover:border-border"
            >
              Create Account
            </Link>
          </div>

          <div className="mt-6 text-center">
            <Link
              to="/login"
              className="font-medium text-primary hover:text-primary"
            >
              Already have an account? Sign in
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
