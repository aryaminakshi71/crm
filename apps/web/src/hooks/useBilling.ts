/**
 * Billing Hook
 *
 * React hook for billing and subscription management.
 */

import { useQuery, useMutation } from "@tanstack/react-query";
import { api } from "@/lib/orpc";

export function useBilling() {
  // Get current subscription
  const subscriptionQuery = useQuery({
    queryKey: ["subscription"],
    queryFn: () => api.billing.subscription.get({}),
  });

  // Get available plans
  const plansQuery = useQuery({
    queryKey: ["plans"],
    queryFn: () => api.billing.plans.list({}),
  });

  // Get usage
  const usageQuery = useQuery({
    queryKey: ["usage"],
    queryFn: () => api.billing.usage.get({}),
  });

  // Get module access
  const moduleAccessQuery = useQuery({
    queryKey: ["moduleAccess"],
    queryFn: () => api.billing.modules.getModuleAccess({}),
  });

  // Get invoices
  const invoicesQuery = useQuery({
    queryKey: ["invoices"],
    queryFn: () =>
      api.billing.invoices.list({
        page: 1,
        limit: 20,
      }),
  });

  // Get payments
  const paymentsQuery = useQuery({
    queryKey: ["payments"],
    queryFn: () =>
      api.billing.payments.list({
        page: 1,
        limit: 20,
      }),
  });

  // Create checkout session
  const checkoutMutation = useMutation({
    mutationFn: (input: {
      planKey: string;
      billingCycle: "monthly" | "annual";
      successUrl: string;
      cancelUrl: string;
    }) => api.billing.checkout.createCheckoutSession(input),
  });

  // Create portal session
  const portalMutation = useMutation({
    mutationFn: (input: { returnUrl: string }) =>
      api.billing.portal.createPortalSession(input),
  });

  return {
    // Queries
    subscription: subscriptionQuery.data?.subscription,
    subscriptionLoading: subscriptionQuery.isLoading,
    isTrial: subscriptionQuery.data?.isTrial,
    daysRemaining: subscriptionQuery.data?.daysRemaining,

    plans: plansQuery.data?.plans ?? [],
    plansLoading: plansQuery.isLoading,

    usage: usageQuery.data?.usage,
    usageLimits: usageQuery.data?.limits,
    usagePercentages: usageQuery.data?.percentages,
    usageLoading: usageQuery.isLoading,

    modules: moduleAccessQuery.data?.modules ?? {},
    moduleAccessLoading: moduleAccessQuery.isLoading,

    invoices: invoicesQuery.data?.invoices ?? [],
    invoicesPagination: invoicesQuery.data?.pagination,
    invoicesLoading: invoicesQuery.isLoading,

    payments: paymentsQuery.data?.payments ?? [],
    paymentsPagination: paymentsQuery.data?.pagination,
    paymentsLoading: paymentsQuery.isLoading,

    // Mutations
    checkout: checkoutMutation.mutateAsync,
    checkoutLoading: checkoutMutation.isPending,

    openPortal: portalMutation.mutateAsync,
    portalLoading: portalMutation.isPending,

    // Refetch functions
    refetchSubscription: subscriptionQuery.refetch,
    refetchUsage: usageQuery.refetch,
    refetchInvoices: invoicesQuery.refetch,
  };
}

// Helper to check if module is accessible
export function useModuleAccess(moduleKey: string) {
  const { modules } = useBilling();

  const module = modules[moduleKey];
  return {
    hasAccess: module?.enabled ?? false,
    source: module?.source ?? null,
    canEnable: module?.source !== "base", // Can't enable base modules
  };
}

// Helper to check usage limits
export function useUsageLimit(type: "apiCalls" | "storage" | "users") {
  const { usage, usageLimits: limits, usagePercentages: percentages } = useBilling();

  return {
    used: usage?.[type] ?? 0,
    limit: limits?.[type === "storage" ? "maxStorage" : type === "apiCalls" ? "maxApiCalls" : "maxUsers"] ?? 0,
    percentage: percentages?.[type] ?? 0,
    isNearLimit: (percentages?.[type] ?? 0) >= 80,
    isOverLimit: (percentages?.[type] ?? 0) >= 100,
  };
}
