/**
 * Custom Hook Unit Tests
 */

import { describe, expect, it, vi, beforeEach } from "vitest";
import { renderHook } from "@testing-library/react";
import React from "react";

// ─── Mocks ────────────────────────────────────────────────────────────────────

vi.mock("@tanstack/react-query", () => ({
  useQuery: vi.fn(),
  useMutation: vi.fn(),
  QueryClient: vi.fn().mockImplementation(() => ({})),
  QueryClientProvider: ({ children }: any) => children,
}));

vi.mock("@/lib/orpc", () => ({
  api: {
    billing: {
      subscription: { get: vi.fn() },
      plans: { list: vi.fn() },
      usage: { get: vi.fn() },
      modules: { getModuleAccess: vi.fn() },
      invoices: { list: vi.fn() },
      payments: { list: vi.fn() },
      checkout: { createCheckoutSession: vi.fn() },
      portal: { createPortalSession: vi.fn() },
      admin: {
        subscriptions: { listAdminSubscriptions: vi.fn() },
        getAdminBillingStats: vi.fn(),
        getOrgBillingDetails: vi.fn(),
        listPlans: vi.fn(),
        createPlan: vi.fn(),
        updatePlan: vi.fn(),
      },
    },
  },
}));

import { useQuery, useMutation } from "@tanstack/react-query";

// ─── Helper: make useQuery return specific data ───────────────────────────────

function mockUseQuery(data: any, extra: Record<string, any> = {}) {
  (useQuery as any).mockReturnValue({
    data,
    isLoading: false,
    isError: false,
    refetch: vi.fn(),
    ...extra,
  });
}

function mockUseQueryLoading() {
  (useQuery as any).mockReturnValue({
    data: undefined,
    isLoading: true,
    isError: false,
    refetch: vi.fn(),
  });
}

function mockUseQueryError() {
  (useQuery as any).mockReturnValue({
    data: undefined,
    isLoading: false,
    isError: true,
    error: new Error("API error"),
    refetch: vi.fn(),
  });
}

function mockUseMutation(extra: Record<string, any> = {}) {
  (useMutation as any).mockReturnValue({
    mutateAsync: vi.fn(),
    isPending: false,
    isError: false,
    ...extra,
  });
}

// ─── useBilling Tests ─────────────────────────────────────────────────────────

describe("useBilling hook", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns subscription data when loaded", async () => {
    const mockSubscription = {
      id: "sub_1",
      planKey: "growth",
      status: "active",
    };

    (useQuery as any).mockReturnValue({
      data: { subscription: mockSubscription, isTrial: false, daysRemaining: 0 },
      isLoading: false,
      refetch: vi.fn(),
    });
    (useMutation as any).mockReturnValue({
      mutateAsync: vi.fn(),
      isPending: false,
    });

    const { useBilling } = await import("@/hooks/useBilling");
    const { result } = renderHook(() => useBilling());

    expect(result.current.subscription).toEqual(mockSubscription);
  });

  it("returns subscriptionLoading=true when subscription is loading", async () => {
    (useQuery as any).mockReturnValue({
      data: undefined,
      isLoading: true,
      refetch: vi.fn(),
    });
    (useMutation as any).mockReturnValue({
      mutateAsync: vi.fn(),
      isPending: false,
    });

    const { useBilling } = await import("@/hooks/useBilling");
    const { result } = renderHook(() => useBilling());

    expect(result.current.subscriptionLoading).toBe(true);
  });

  it("returns empty plans array when plans data is undefined", async () => {
    (useQuery as any).mockReturnValue({
      data: undefined,
      isLoading: false,
      refetch: vi.fn(),
    });
    (useMutation as any).mockReturnValue({
      mutateAsync: vi.fn(),
      isPending: false,
    });

    const { useBilling } = await import("@/hooks/useBilling");
    const { result } = renderHook(() => useBilling());

    expect(result.current.plans).toEqual([]);
  });

  it("returns isTrial flag from subscription query", async () => {
    (useQuery as any).mockReturnValue({
      data: { subscription: null, isTrial: true, daysRemaining: 12 },
      isLoading: false,
      refetch: vi.fn(),
    });
    (useMutation as any).mockReturnValue({
      mutateAsync: vi.fn(),
      isPending: false,
    });

    const { useBilling } = await import("@/hooks/useBilling");
    const { result } = renderHook(() => useBilling());

    expect(result.current.isTrial).toBe(true);
    expect(result.current.daysRemaining).toBe(12);
  });

  it("returns empty invoices array when invoices data is undefined", async () => {
    (useQuery as any).mockReturnValue({
      data: undefined,
      isLoading: false,
      refetch: vi.fn(),
    });
    (useMutation as any).mockReturnValue({
      mutateAsync: vi.fn(),
      isPending: false,
    });

    const { useBilling } = await import("@/hooks/useBilling");
    const { result } = renderHook(() => useBilling());

    expect(result.current.invoices).toEqual([]);
  });

  it("exposes checkout mutation function", async () => {
    (useQuery as any).mockReturnValue({
      data: undefined,
      isLoading: false,
      refetch: vi.fn(),
    });
    const mockCheckout = vi.fn();
    (useMutation as any).mockReturnValue({
      mutateAsync: mockCheckout,
      isPending: false,
    });

    const { useBilling } = await import("@/hooks/useBilling");
    const { result } = renderHook(() => useBilling());

    expect(typeof result.current.checkout).toBe("function");
  });

  it("exposes openPortal mutation function", async () => {
    (useQuery as any).mockReturnValue({
      data: undefined,
      isLoading: false,
      refetch: vi.fn(),
    });
    (useMutation as any).mockReturnValue({
      mutateAsync: vi.fn(),
      isPending: false,
    });

    const { useBilling } = await import("@/hooks/useBilling");
    const { result } = renderHook(() => useBilling());

    expect(typeof result.current.openPortal).toBe("function");
  });

  it("returns modules as empty object when moduleAccess data is undefined", async () => {
    (useQuery as any).mockReturnValue({
      data: undefined,
      isLoading: false,
      refetch: vi.fn(),
    });
    (useMutation as any).mockReturnValue({
      mutateAsync: vi.fn(),
      isPending: false,
    });

    const { useBilling } = await import("@/hooks/useBilling");
    const { result } = renderHook(() => useBilling());

    expect(result.current.modules).toEqual({});
  });
});

// ─── useModuleAccess Tests ────────────────────────────────────────────────────

describe("useModuleAccess hook", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns hasAccess=false when module is not in modules object", async () => {
    (useQuery as any).mockReturnValue({
      data: { modules: {} },
      isLoading: false,
      refetch: vi.fn(),
    });
    (useMutation as any).mockReturnValue({
      mutateAsync: vi.fn(),
      isPending: false,
    });

    const { useModuleAccess } = await import("@/hooks/useBilling");
    const { result } = renderHook(() => useModuleAccess("crm"));

    expect(result.current.hasAccess).toBe(false);
  });

  it("returns hasAccess=true when module is enabled", async () => {
    (useQuery as any).mockReturnValue({
      data: {
        modules: {
          crm: { enabled: true, source: "plan" },
        },
      },
      isLoading: false,
      refetch: vi.fn(),
    });
    (useMutation as any).mockReturnValue({
      mutateAsync: vi.fn(),
      isPending: false,
    });

    const { useModuleAccess } = await import("@/hooks/useBilling");
    const { result } = renderHook(() => useModuleAccess("crm"));

    expect(result.current.hasAccess).toBe(true);
  });
});

// ─── useUsageLimit Tests ──────────────────────────────────────────────────────

describe("useUsageLimit hook", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns isNearLimit=false when usage is below 80%", async () => {
    (useQuery as any).mockReturnValue({
      data: {
        usage: { apiCalls: 500 },
        limits: { maxApiCalls: 1000 },
        percentages: { apiCalls: 50 },
      },
      isLoading: false,
      refetch: vi.fn(),
    });
    (useMutation as any).mockReturnValue({
      mutateAsync: vi.fn(),
      isPending: false,
    });

    const { useUsageLimit } = await import("@/hooks/useBilling");
    const { result } = renderHook(() => useUsageLimit("apiCalls"));

    expect(result.current.isNearLimit).toBe(false);
    expect(result.current.isOverLimit).toBe(false);
  });

  it("returns isNearLimit=true when usage is at 80%+", async () => {
    (useQuery as any).mockReturnValue({
      data: {
        usage: { apiCalls: 850 },
        limits: { maxApiCalls: 1000 },
        percentages: { apiCalls: 85 },
      },
      isLoading: false,
      refetch: vi.fn(),
    });
    (useMutation as any).mockReturnValue({
      mutateAsync: vi.fn(),
      isPending: false,
    });

    const { useUsageLimit } = await import("@/hooks/useBilling");
    const { result } = renderHook(() => useUsageLimit("apiCalls"));

    expect(result.current.isNearLimit).toBe(true);
  });

  it("returns isOverLimit=true when usage is at 100%+", async () => {
    (useQuery as any).mockReturnValue({
      data: {
        usage: { apiCalls: 1000 },
        limits: { maxApiCalls: 1000 },
        percentages: { apiCalls: 100 },
      },
      isLoading: false,
      refetch: vi.fn(),
    });
    (useMutation as any).mockReturnValue({
      mutateAsync: vi.fn(),
      isPending: false,
    });

    const { useUsageLimit } = await import("@/hooks/useBilling");
    const { result } = renderHook(() => useUsageLimit("apiCalls"));

    expect(result.current.isOverLimit).toBe(true);
  });
});

// ─── Plan Data Parsing Tests ──────────────────────────────────────────────────

describe("Plan data parsing (monthly/yearly toggle logic)", () => {
  function computeDisplayPrice(
    plan: { basePriceMonthly: number; basePriceAnnual: number },
    billingCycle: "monthly" | "annual",
  ): number {
    return billingCycle === "monthly"
      ? plan.basePriceMonthly
      : Math.round(plan.basePriceAnnual / 12);
  }

  function computeSavings(plan: {
    basePriceMonthly: number;
    basePriceAnnual: number;
  }): number {
    const annualMonthly = plan.basePriceMonthly * 12;
    return Math.round(((annualMonthly - plan.basePriceAnnual) / annualMonthly) * 100);
  }

  const plan = {
    basePriceMonthly: 29,
    basePriceAnnual: 290, // ~$24.17/mo
  };

  it("returns monthly price for monthly billing cycle", () => {
    expect(computeDisplayPrice(plan, "monthly")).toBe(29);
  });

  it("returns annual-divided-by-12 for annual billing cycle", () => {
    expect(computeDisplayPrice(plan, "annual")).toBe(24);
  });

  it("computes savings percentage correctly", () => {
    const savings = computeSavings(plan);
    expect(savings).toBeGreaterThan(0);
    expect(savings).toBeLessThan(50);
  });

  it("monthly price is always higher than annual-divided-by-12", () => {
    const monthly = computeDisplayPrice(plan, "monthly");
    const annual = computeDisplayPrice(plan, "annual");
    expect(monthly).toBeGreaterThan(annual);
  });
});
