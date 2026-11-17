import { createFileRoute } from "@tanstack/react-router";
import { Check, CreditCard, Zap } from "lucide-react";
import { Button } from "../components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "../components/ui/card";

// @ts-ignore - route registered separately
export const Route = createFileRoute("/billing")({
  component: BillingPage,
});

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
    current: false,
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
    current: true,
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
    current: false,
  },
];

function BillingPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-white">Billing</h1>
        <p className="text-zinc-400 mt-1">
          Manage your subscription and billing information
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-white">Current Plan</CardTitle>
          <CardDescription>You are currently on the Pro plan</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between p-4 bg-zinc-900 rounded-lg">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-lg bg-violet-600 flex items-center justify-center">
                <Zap className="w-6 h-6 text-white" />
              </div>
              <div>
                <p className="font-semibold text-white">Pro Plan</p>
                <p className="text-sm text-zinc-400">
                  $29/month • Renews on Apr 1, 2024
                </p>
              </div>
            </div>
            <Button variant="outline">Manage Plan</Button>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-white">Available Plans</CardTitle>
          <CardDescription>
            Choose the plan that best fits your needs
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {plans.map((plan) => (
              <div
                key={plan.name}
                className={`relative p-6 rounded-xl border ${
                  plan.current
                    ? "border-violet-500 bg-violet-500/5"
                    : "border-zinc-800 bg-zinc-900"
                }`}
              >
                {plan.current && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-1 bg-violet-600 text-white text-xs font-medium rounded-full">
                    Current
                  </div>
                )}
                <h3 className="text-lg font-semibold text-white">
                  {plan.name}
                </h3>
                <div className="flex items-baseline gap-1 mt-2">
                  <span className="text-3xl font-bold text-white">
                    {plan.price}
                  </span>
                  {plan.period && (
                    <span className="text-zinc-400">{plan.period}</span>
                  )}
                </div>
                <p className="text-sm text-zinc-400 mt-2">{plan.description}</p>
                <ul className="mt-4 space-y-2">
                  {plan.features.map((feature) => (
                    <li
                      key={feature}
                      className="flex items-center gap-2 text-sm text-zinc-300"
                    >
                      <Check className="w-4 h-4 text-violet-400" />
                      {feature}
                    </li>
                  ))}
                </ul>
                <Button
                  className="w-full mt-6"
                  variant={plan.current ? "outline" : "default"}
                  disabled={plan.current}
                >
                  {plan.current
                    ? "Current Plan"
                    : plan.name === "Enterprise"
                      ? "Contact Sales"
                      : "Upgrade"}
                </Button>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-white">Payment Method</CardTitle>
          <CardDescription>Manage your payment information</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between p-4 bg-zinc-900 rounded-lg">
            <div className="flex items-center gap-4">
              <div className="w-12 h-8 bg-zinc-800 rounded flex items-center justify-center">
                <CreditCard className="w-5 h-5 text-zinc-400" />
              </div>
              <div>
                <p className="font-medium text-white">•••• •••• •••• 4242</p>
                <p className="text-sm text-zinc-400">Expires 12/2025</p>
              </div>
            </div>
            <Button variant="outline" size="sm">
              Update
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
