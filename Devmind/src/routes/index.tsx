import { Link, createFileRoute } from "@tanstack/react-router";
import {
  ArrowRight,
  BarChart3,
  Bot,
  Check,
  Code,
  Shield,
  Zap,
} from "lucide-react";
import { Button } from "../components/ui/button";

export const Route = createFileRoute("/")({
  component: IndexPage,
});

const features = [
  {
    title: "AI Code Assistant",
    description: "Write, debug, and review code with AI-powered assistance",
    icon: Code,
    color: "bg-emerald-500/10 text-emerald-400",
  },
  {
    title: "Autonomous Agents",
    description: "Deploy self-directed agents to handle complex workflows",
    icon: Bot,
    color: "bg-violet-500/10 text-violet-400",
  },
  {
    title: "Analytics Dashboard",
    description: "Track usage, performance, and costs in real-time",
    icon: BarChart3,
    color: "bg-blue-500/10 text-blue-400",
  },
  {
    title: "Enterprise Security",
    description: "Bank-grade security with SSO and audit logs",
    icon: Shield,
    color: "bg-orange-500/10 text-orange-400",
  },
];

const plans = [
  {
    name: "Starter",
    price: "Free",
    description: "Perfect for trying out AI agents",
    features: [
      "1,000 tokens/month",
      "3 agents",
      "Basic support",
      "Community access",
    ],
    cta: "Start Free",
    popular: false,
  },
  {
    name: "Pro",
    price: "$29",
    period: "/month",
    description: "For growing teams and businesses",
    features: [
      "50,000 tokens/month",
      "Unlimited agents",
      "Priority support",
      "API access",
      "Custom tools",
    ],
    cta: "Get Started",
    popular: true,
  },
  {
    name: "Enterprise",
    price: "Custom",
    description: "For large organizations",
    features: [
      "Unlimited tokens",
      "Dedicated infrastructure",
      "24/7 support",
      "SLA guarantee",
      "On-premise option",
    ],
    cta: "Contact Sales",
    popular: false,
  },
];

function IndexPage() {
  return (
    <div className="min-h-screen bg-zinc-950">
      <header className="fixed top-0 left-0 right-0 z-50 bg-zinc-950/80 backdrop-blur-md border-b border-zinc-800">
        <div className="container mx-auto px-4 py-4 flex justify-between items-center">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-violet-600 flex items-center justify-center">
              <Zap className="w-5 h-5 text-white" />
            </div>
            <span className="text-xl font-bold text-white">DevMind</span>
          </div>
          <nav className="hidden md:flex items-center gap-8">
            <Link
              to="/agents"
              className="text-zinc-400 hover:text-white transition"
            >
              Agents
            </Link>
            <a
              href="/pricing"
              className="text-zinc-400 hover:text-white transition"
            >
              Pricing
            </a>
            <a
              href="/docs"
              className="text-zinc-400 hover:text-white transition"
            >
              Docs
            </a>
          </nav>
          <div className="flex items-center gap-3">
            <Link to="/login">
              <Button variant="ghost">Login</Button>
            </Link>
            <Link to="/signup">
              <Button>Get Started</Button>
            </Link>
          </div>
        </div>
      </header>

      <main>
        <section className="pt-32 pb-20 relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-br from-violet-600/20 via-transparent to-blue-600/20" />
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-violet-600/10 rounded-full blur-3xl" />

          <div className="container mx-auto px-4 relative">
            <div className="text-center max-w-3xl mx-auto">
              <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-violet-500/10 border border-violet-500/20 text-violet-400 text-sm mb-6">
                <Zap className="w-4 h-4" />
                <span>Build AI agents in minutes</span>
              </div>

              <h1 className="text-5xl md:text-6xl font-bold text-white mb-6 leading-tight">
                AI Agents for
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-violet-400 to-blue-400">
                  {" "}
                  Developers
                </span>
              </h1>

              <p className="text-xl text-zinc-400 mb-8 max-w-2xl mx-auto">
                Create, deploy, and manage autonomous AI agents. Automate
                workflows, enhance coding, and boost productivity with DevMind.
              </p>

              <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
                <Link to="/signup">
                  <Button size="lg" className="gap-2 text-base">
                    Start Building Free
                    <ArrowRight className="w-4 h-4" />
                  </Button>
                </Link>
                <Link to="/agents">
                  <Button variant="outline" size="lg" className="text-base">
                    View Demo
                  </Button>
                </Link>
              </div>
            </div>
          </div>
        </section>

        <section className="py-20">
          <div className="container mx-auto px-4">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {features.map((feature) => {
                const Icon = feature.icon;
                return (
                  <div
                    key={feature.title}
                    className="bg-zinc-900/50 border border-zinc-800 rounded-xl p-6 hover:border-violet-500/30 transition-colors"
                  >
                    <div
                      className={`w-12 h-12 rounded-lg ${feature.color} flex items-center justify-center mb-4`}
                    >
                      <Icon className="w-6 h-6" />
                    </div>
                    <h3 className="text-lg font-semibold text-white mb-2">
                      {feature.title}
                    </h3>
                    <p className="text-zinc-400">{feature.description}</p>
                  </div>
                );
              })}
            </div>
          </div>
        </section>

        <section className="py-20 bg-zinc-900/30">
          <div className="container mx-auto px-4">
            <div className="text-center mb-12">
              <h2 className="text-3xl font-bold text-white mb-4">
                Simple, Transparent Pricing
              </h2>
              <p className="text-zinc-400">Start free and scale as you grow</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-5xl mx-auto">
              {plans.map((plan) => (
                <div
                  key={plan.name}
                  className={`relative bg-zinc-900 border rounded-2xl p-8 ${plan.popular ? "border-violet-500" : "border-zinc-800"}`}
                >
                  {plan.popular && (
                    <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-1 bg-violet-600 text-white text-xs font-medium rounded-full">
                      Most Popular
                    </div>
                  )}
                  <h3 className="text-xl font-semibold text-white mb-2">
                    {plan.name}
                  </h3>
                  <div className="flex items-baseline gap-1 mb-2">
                    <span className="text-4xl font-bold text-white">
                      {plan.price}
                    </span>
                    {plan.period && (
                      <span className="text-zinc-400">{plan.period}</span>
                    )}
                  </div>
                  <p className="text-zinc-400 text-sm mb-6">
                    {plan.description}
                  </p>
                  <ul className="space-y-3 mb-8">
                    {plan.features.map((feature) => (
                      <li
                        key={feature}
                        className="flex items-center gap-2 text-zinc-300"
                      >
                        <Check className="w-4 h-4 text-violet-400" />
                        {feature}
                      </li>
                    ))}
                  </ul>
                  <Button
                    className="w-full"
                    variant={plan.popular ? "default" : "outline"}
                  >
                    {plan.cta}
                  </Button>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section className="py-20">
          <div className="container mx-auto px-4">
            <div className="bg-gradient-to-r from-violet-600 to-blue-600 rounded-2xl p-8 md:p-12 text-center">
              <h2 className="text-3xl font-bold text-white mb-4">
                Ready to get started?
              </h2>
              <p className="text-white/80 mb-8 max-w-xl mx-auto">
                Join thousands of developers building AI agents with DevMind.
                Start for free, no credit card required.
              </p>
              <Link to="/signup">
                <Button size="lg" variant="secondary" className="gap-2">
                  Create Free Account
                  <ArrowRight className="w-4 h-4" />
                </Button>
              </Link>
            </div>
          </div>
        </section>
      </main>

      <footer className="border-t border-zinc-800 py-12">
        <div className="container mx-auto px-4">
          <div className="flex flex-col md:flex-row justify-between items-center gap-4">
            <div className="flex items-center gap-2">
              <div className="w-6 h-6 rounded-md bg-violet-600 flex items-center justify-center">
                <Zap className="w-4 h-4 text-white" />
              </div>
              <span className="font-bold text-white">DevMind</span>
            </div>
            <div className="flex items-center gap-6 text-zinc-400">
              <Link to="/agents" className="hover:text-white transition">
                Agents
              </Link>
              <a href="/pricing" className="hover:text-white transition">
                Pricing
              </a>
              <a href="/docs" className="hover:text-white transition">
                Docs
              </a>
              <Link to="/login" className="hover:text-white transition">
                Login
              </Link>
            </div>
            <p className="text-zinc-500 text-sm">
              © 2024 DevMind. All rights reserved.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}
