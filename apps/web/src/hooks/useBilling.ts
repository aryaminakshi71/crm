/**
 * Billing Hook
 *
 * React hook for billing and subscription management.
 */

import { useQuery, useMutation } from "@tanstack/react-query";
import { createOrpcClient } from "@/lib/api";

const orpc = createOrpcClient();

export function useBilling() {
  // Get current subscription
  const subscriptionQuery = useQuery({
    queryKey: ["subscription"],
    queryFn: () => orpc.billing.subscription.get({}),
  });

  // Get available plans
  const plansQuery = useQuery({
    queryKey: ["plans"],
    queryFn: () => orpc.billing.plans.list({}),
  });

  // Get usage
  const usageQuery = useQuery({
    queryKey: ["usage"],
    queryFn: () => orpc.billing.usage.get({}),
  });

  // Get module access
  const moduleAccessQuery = useQuery({
    queryKey: ["moduleAccess"],
    queryFn: () => orpc.billing.modules.getModuleAccess({}),
  });

  // Get invoices
  const invoicesQuery = useQuery({
    queryKey: ["invoices"],
    queryFn: () =>
      orpc.billing.invoices.list({
        page: 1,
        limit: 20,
      }),
  });

  // Get payments
  const paymentsQuery = useQuery({
    queryKey: ["payments"],
    queryFn: () =>
      orpc.billing.payments.list({
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
    }) => orpc.billing.checkout.createCheckoutSession(input),
  });

  // Create portal session
  const portalMutation = useMutation({
    mutationFn: (input: { returnUrl: string }) =>
      orpc.billing.portal.createPortalSession(input),
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

export function useAdminBilling() {
  // Get all subscriptions
  const subscriptionsQuery = useQuery({
    queryKey: ["adminSubscriptions"],
    queryFn: () =>
      orpc.billing.admin.subscriptions.listAdminSubscriptions({
        page: 1,
        limit: 50,
      }),
  });

  // Get billing stats
  const statsQuery = useQuery({
    queryKey: ["billingStats"],
    queryFn: () =>
      orpc.billing.admin.getAdminBillingStats({
        periodStart: new Date().toISOString().slice(0, 7) + "-01",
        periodEnd: new Date().toISOString(),
      }),
  });

  // Get specific organization billing
  const orgBillingQuery = (orgId: string) =>
    useQuery({
      queryKey: ["orgBilling", orgId],
      queryFn: () =>
        orpc.billing.admin.getOrgBillingDetails({
          orgId,
        }),
    });

  // Get all plans
  const plansQuery = useQuery({
    queryKey: ["adminPlans"],
    queryFn: () => orpc.billing.admin.listPlans({}),
  });

  // Create plan
  const createPlanMutation = useMutation({
    mutationFn: (input: {
      key: string;
      name: string;
      description?: string;
      basePriceMonthly: number;
      basePriceAnnual: number;
      pricePerUserMonthly: number;
      pricePerUserAnnual: number;
      maxUsers: number;
      maxStorage: number;
      maxApiCalls: number;
      features: string[];
      moduleAccess: string[];
      isPublic: boolean;
      trialDays: number;
    }) => orpc.billing.admin.createPlan(input),
  });

  // Update plan
  const updatePlanMutation = useMutation({
    mutationFn: (input: {
      key: string;
      name?: string;
      description?: string;
      basePriceMonthly?: number;
      basePriceAnnual?: number;
      pricePerUserMonthly?: number;
      pricePerUserAnnual?: number;
      maxUsers?: number;
      maxStorage?: number;
      maxApiCalls?: number;
      features?: string[];
      moduleAccess?: string[];
      isPublic?: boolean;
      trialDays?: number;
    }) => orpc.billing.admin.updatePlan(input),
  });

  return {
    subscriptions: subscriptionsQuery.data?.subscriptions ?? [],
    subscriptionsPagination: subscriptionsQuery.data?.pagination,
    subscriptionsLoading: subscriptionsQuery.isLoading,

    stats: statsQuery.data?.stats,
    recentInvoices: statsQuery.data?.recentInvoices ?? [],
    recentPayments: statsQuery.data?.recentPayments ?? [],
    statsLoading: statsQuery.isLoading,

    plans: plansQuery.data?.plans ?? [],
    plansLoading: plansQuery.isLoading,

    getOrgBilling: orgBillingQuery,
    refetchSubscriptions: subscriptionsQuery.refetch,
    refetchStats: statsQuery.refetch,

    createPlan: createPlanMutation.mutateAsync,
    createPlanLoading: createPlanMutation.isPending,

    updatePlan: updatePlanMutation.mutateAsync,
    updatePlanLoading: updatePlanMutation.isPending,
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
  const { usage, limits, percentages } = useBilling();

  return {
    used: usage?.[type] ?? 0,
    limit: limits?.[type === "storage" ? "maxStorage" : type === "apiCalls" ? "maxApiCalls" : "maxUsers"] ?? 0,
    percentage: percentages?.[type] ?? 0,
    isNearLimit: (percentages?.[type] ?? 0) >= 80,
    isOverLimit: (percentages?.[type] ?? 0) >= 100,
  };
}
