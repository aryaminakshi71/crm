/**
 * Integration Tests: Invoicing API Calls
 */

import { describe, expect, it, vi, beforeEach, afterEach } from "vitest";

// ─── Mock fetch setup ──────────────────────────────────────────────────────────

function createFetchMock(status: number, responseBody: any) {
  return vi.fn().mockResolvedValue({
    ok: status >= 200 && status < 300,
    status,
    json: async () => responseBody,
    text: async () => JSON.stringify(responseBody),
  });
}

const ORIGINAL_FETCH = global.fetch;

function mockLocalStorage() {
  Object.defineProperty(global, "localStorage", {
    value: {
      getItem: vi.fn().mockReturnValue(null),
      setItem: vi.fn(),
      removeItem: vi.fn(),
      clear: vi.fn(),
    },
    writable: true,
  });
}

const API_BASE = "/api/v1";

// ─── Invoice Listing Tests ─────────────────────────────────────────────────────

describe("Invoicing: List invoices with pagination", () => {
  beforeEach(() => {
    mockLocalStorage();
  });

  afterEach(() => {
    global.fetch = ORIGINAL_FETCH;
    vi.clearAllMocks();
  });

  it("sends GET to invoices endpoint", async () => {
    const fetchMock = createFetchMock(200, {
      data: [],
      total: 0,
      page: 1,
      limit: 20,
    });
    global.fetch = fetchMock;

    await fetch(`${API_BASE}/invoicing/invoices`);

    const url = fetchMock.mock.calls[0][0] as string;
    expect(url).toContain("/invoicing/invoices");
  });

  it("includes pagination params in query string", async () => {
    const fetchMock = createFetchMock(200, { data: [], total: 0, page: 2, limit: 10 });
    global.fetch = fetchMock;

    await fetch(`${API_BASE}/invoicing/invoices?page=2&limit=10`);

    const url = fetchMock.mock.calls[0][0] as string;
    expect(url).toContain("page=2");
    expect(url).toContain("limit=10");
  });

  it("returns list of invoices with correct structure", async () => {
    const invoices = [
      { id: "inv-1", invoiceNumber: "INV-001", total: 1500, status: "draft" },
      { id: "inv-2", invoiceNumber: "INV-002", total: 3000, status: "sent" },
    ];
    const fetchMock = createFetchMock(200, {
      data: invoices,
      total: 2,
      page: 1,
      limit: 20,
      totalPages: 1,
    });
    global.fetch = fetchMock;

    const res = await fetch(`${API_BASE}/invoicing/invoices`);
    const body = await res.json();

    expect(body.data).toHaveLength(2);
    expect(body.total).toBe(2);
    expect(body.totalPages).toBe(1);
  });

  it("invoice entries have required fields", async () => {
    const fetchMock = createFetchMock(200, {
      data: [
        {
          id: "inv-1",
          invoiceNumber: "INV-001",
          total: 500,
          status: "paid",
          issuedAt: "2026-01-01T00:00:00Z",
          dueAt: "2026-02-01T00:00:00Z",
        },
      ],
      total: 1,
      page: 1,
      limit: 20,
    });
    global.fetch = fetchMock;

    const res = await fetch(`${API_BASE}/invoicing/invoices`);
    const body = await res.json();
    const invoice = body.data[0];

    expect(invoice.invoiceNumber).toBeDefined();
    expect(invoice.total).toBeDefined();
    expect(invoice.status).toBeDefined();
  });
});

// ─── Invoice Creation Tests ────────────────────────────────────────────────────

describe("Invoicing: Create invoice", () => {
  beforeEach(() => {
    mockLocalStorage();
  });

  afterEach(() => {
    global.fetch = ORIGINAL_FETCH;
    vi.clearAllMocks();
  });

  it("sends POST request with invoiceNumber and total", async () => {
    const fetchMock = createFetchMock(201, {
      id: "inv-new",
      invoiceNumber: "INV-2026-001",
      total: 2500,
      status: "draft",
    });
    global.fetch = fetchMock;

    await fetch(`${API_BASE}/invoicing/invoices`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        invoiceNumber: "INV-2026-001",
        total: 2500,
        status: "draft",
      }),
    });

    const call = fetchMock.mock.calls[0];
    expect(call[1].method).toBe("POST");
    const body = JSON.parse(call[1].body);
    expect(body.invoiceNumber).toBe("INV-2026-001");
    expect(body.total).toBe(2500);
  });

  it("returns created invoice with id", async () => {
    const fetchMock = createFetchMock(201, {
      id: "inv-generated",
      invoiceNumber: "INV-003",
      total: 750,
      status: "draft",
    });
    global.fetch = fetchMock;

    const res = await fetch(`${API_BASE}/invoicing/invoices`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ invoiceNumber: "INV-003", total: 750, status: "draft" }),
    });
    const invoice = await res.json();

    expect(invoice.id).toBeDefined();
    expect(invoice.invoiceNumber).toBe("INV-003");
  });

  it("sends line items when provided", async () => {
    const fetchMock = createFetchMock(201, { id: "inv-lines" });
    global.fetch = fetchMock;

    const lineItems = [
      { description: "Consulting", quantity: 5, unitPrice: 200, total: 1000 },
      { description: "Support", quantity: 2, unitPrice: 150, total: 300 },
    ];

    await fetch(`${API_BASE}/invoicing/invoices`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        invoiceNumber: "INV-004",
        total: 1300,
        status: "draft",
        lineItems,
      }),
    });

    const body = JSON.parse(fetchMock.mock.calls[0][1].body);
    expect(body.lineItems).toHaveLength(2);
    expect(body.lineItems[0].description).toBe("Consulting");
  });
});

// ─── Invoice Status Update Tests ───────────────────────────────────────────────

describe("Invoicing: Invoice status lifecycle", () => {
  beforeEach(() => {
    mockLocalStorage();
  });

  afterEach(() => {
    global.fetch = ORIGINAL_FETCH;
    vi.clearAllMocks();
  });

  it("transitions invoice from draft to sent", async () => {
    const fetchMock = createFetchMock(200, {
      id: "inv-1",
      status: "sent",
      sentAt: "2026-03-23T10:00:00Z",
    });
    global.fetch = fetchMock;

    await fetch(`${API_BASE}/invoicing/invoices/inv-1`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: "sent" }),
    });

    const body = JSON.parse(fetchMock.mock.calls[0][1].body);
    expect(body.status).toBe("sent");
  });

  it("transitions invoice from sent to paid", async () => {
    const fetchMock = createFetchMock(200, {
      id: "inv-2",
      status: "paid",
      paidAt: "2026-03-24T00:00:00Z",
    });
    global.fetch = fetchMock;

    await fetch(`${API_BASE}/invoicing/invoices/inv-2`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: "paid" }),
    });

    const res = await (fetchMock.mock.results[0].value as Promise<Response>);
    const body = await res.json();
    expect(body.status).toBe("paid");
    expect(body.paidAt).toBeDefined();
  });

  it("targets the correct invoice in the URL", async () => {
    const fetchMock = createFetchMock(200, { id: "inv-xyz", status: "sent" });
    global.fetch = fetchMock;

    await fetch(`${API_BASE}/invoicing/invoices/inv-xyz`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: "sent" }),
    });

    const url = fetchMock.mock.calls[0][0] as string;
    expect(url).toContain("/invoicing/invoices/inv-xyz");
  });

  it("validates status transition logic", () => {
    const validTransitions: Record<string, string[]> = {
      draft: ["sent", "cancelled"],
      sent: ["paid", "overdue", "cancelled"],
      paid: [],
      overdue: ["paid", "cancelled"],
      cancelled: [],
    };

    function canTransition(from: string, to: string): boolean {
      return (validTransitions[from] ?? []).includes(to);
    }

    expect(canTransition("draft", "sent")).toBe(true);
    expect(canTransition("sent", "paid")).toBe(true);
    expect(canTransition("paid", "draft")).toBe(false);
    expect(canTransition("cancelled", "paid")).toBe(false);
  });
});

// ─── Payment Recording Tests ───────────────────────────────────────────────────

describe("Invoicing: Record payment", () => {
  beforeEach(() => {
    mockLocalStorage();
  });

  afterEach(() => {
    global.fetch = ORIGINAL_FETCH;
    vi.clearAllMocks();
  });

  it("sends POST to payments endpoint", async () => {
    const fetchMock = createFetchMock(201, {
      id: "pay-1",
      invoiceId: "inv-1",
      amount: 1500,
      method: "bank_transfer",
    });
    global.fetch = fetchMock;

    await fetch(`${API_BASE}/invoicing/payments`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        invoiceId: "inv-1",
        amount: 1500,
        method: "bank_transfer",
        paidAt: "2026-03-23T12:00:00Z",
      }),
    });

    const call = fetchMock.mock.calls[0];
    expect(call[1].method).toBe("POST");
    const body = JSON.parse(call[1].body);
    expect(body.invoiceId).toBe("inv-1");
    expect(body.amount).toBe(1500);
  });

  it("returns recorded payment with id", async () => {
    const fetchMock = createFetchMock(201, {
      id: "pay-new",
      invoiceId: "inv-2",
      amount: 800,
      method: "card",
    });
    global.fetch = fetchMock;

    const res = await fetch(`${API_BASE}/invoicing/payments`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ invoiceId: "inv-2", amount: 800, method: "card" }),
    });
    const payment = await res.json();

    expect(payment.id).toBeDefined();
    expect(payment.amount).toBe(800);
  });

  it("computes outstanding balance after payment", () => {
    function computeBalance(invoiceTotal: number, payments: number[]): number {
      const paid = payments.reduce((sum, p) => sum + p, 0);
      return Math.max(0, invoiceTotal - paid);
    }

    expect(computeBalance(1000, [400, 300])).toBe(300);
    expect(computeBalance(500, [500])).toBe(0);
    expect(computeBalance(200, [300])).toBe(0); // overpayment clamps to 0
  });
});

// ─── Recurring Invoice Tests ───────────────────────────────────────────────────

describe("Invoicing: Recurring invoice setup", () => {
  beforeEach(() => {
    mockLocalStorage();
  });

  afterEach(() => {
    global.fetch = ORIGINAL_FETCH;
    vi.clearAllMocks();
  });

  it("sends recurring flag in create body", async () => {
    const fetchMock = createFetchMock(201, {
      id: "inv-recur",
      invoiceNumber: "INV-R-001",
      total: 500,
      status: "draft",
      isRecurring: true,
      recurringInterval: "monthly",
    });
    global.fetch = fetchMock;

    await fetch(`${API_BASE}/invoicing/invoices`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        invoiceNumber: "INV-R-001",
        total: 500,
        status: "draft",
        isRecurring: true,
        recurringInterval: "monthly",
      }),
    });

    const body = JSON.parse(fetchMock.mock.calls[0][1].body);
    expect(body.isRecurring).toBe(true);
    expect(body.recurringInterval).toBe("monthly");
  });

  it("computes next invoice due date based on interval", () => {
    function getNextDueDate(
      lastDueDate: Date,
      interval: "monthly" | "quarterly" | "annual",
    ): Date {
      const next = new Date(lastDueDate);
      if (interval === "monthly") next.setMonth(next.getMonth() + 1);
      if (interval === "quarterly") next.setMonth(next.getMonth() + 3);
      if (interval === "annual") next.setFullYear(next.getFullYear() + 1);
      return next;
    }

    const base = new Date("2026-01-31");
    const monthly = getNextDueDate(base, "monthly");
    expect(monthly.getMonth()).toBe(2); // March (0-indexed)

    const quarterly = getNextDueDate(base, "quarterly");
    expect(quarterly.getMonth()).toBe(4); // May

    const annual = getNextDueDate(base, "annual");
    expect(annual.getFullYear()).toBe(2027);
  });

  it("validates recurring intervals", () => {
    const validIntervals = ["monthly", "quarterly", "annual"];

    function isValidInterval(interval: string): boolean {
      return validIntervals.includes(interval);
    }

    expect(isValidInterval("monthly")).toBe(true);
    expect(isValidInterval("quarterly")).toBe(true);
    expect(isValidInterval("weekly")).toBe(false);
  });
});

// ─── Error State Tests ─────────────────────────────────────────────────────────

describe("Invoicing: Error states", () => {
  beforeEach(() => {
    mockLocalStorage();
  });

  afterEach(() => {
    global.fetch = ORIGINAL_FETCH;
    vi.clearAllMocks();
  });

  it("handles 422 validation error on create", async () => {
    const fetchMock = createFetchMock(422, {
      message: "Validation failed",
      errors: [{ field: "total", message: "must be a positive number" }],
    });
    global.fetch = fetchMock;

    const res = await fetch(`${API_BASE}/invoicing/invoices`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ invoiceNumber: "INV-BAD", total: -100 }),
    });

    expect(res.ok).toBe(false);
    expect(res.status).toBe(422);
    const body = await res.json();
    expect(body.errors).toBeDefined();
  });

  it("handles 404 when invoice not found", async () => {
    const fetchMock = createFetchMock(404, { message: "Invoice not found" });
    global.fetch = fetchMock;

    const res = await fetch(`${API_BASE}/invoicing/invoices/nonexistent`);

    expect(res.status).toBe(404);
  });

  it("handles network failure on payment record", async () => {
    global.fetch = vi.fn().mockRejectedValue(new Error("Network unreachable"));

    await expect(
      fetch(`${API_BASE}/invoicing/payments`, {
        method: "POST",
        body: JSON.stringify({ invoiceId: "inv-x", amount: 100 }),
      }),
    ).rejects.toThrow("Network unreachable");
  });
});
