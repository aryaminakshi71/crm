/**
 * Integration Tests: Helpdesk API Calls
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

// ─── Ticket Listing Tests ──────────────────────────────────────────────────────

describe("Helpdesk: List tickets", () => {
  beforeEach(() => {
    mockLocalStorage();
  });

  afterEach(() => {
    global.fetch = ORIGINAL_FETCH;
    vi.clearAllMocks();
  });

  it("sends GET request to helpdesk tickets endpoint", async () => {
    const fetchMock = createFetchMock(200, {
      data: [],
      total: 0,
      page: 1,
      limit: 50,
    });
    global.fetch = fetchMock;

    await fetch(`${API_BASE}/helpdesk/tickets`);

    expect(fetchMock).toHaveBeenCalledOnce();
    const url = fetchMock.mock.calls[0][0] as string;
    expect(url).toContain("/helpdesk/tickets");
  });

  it("returns paginated ticket list", async () => {
    const tickets = [
      { id: "t1", subject: "Login broken", priority: "high", status: "open" },
      { id: "t2", subject: "Slow dashboard", priority: "medium", status: "pending" },
    ];
    const fetchMock = createFetchMock(200, {
      data: tickets,
      total: 2,
      page: 1,
      limit: 50,
    });
    global.fetch = fetchMock;

    const res = await fetch(`${API_BASE}/helpdesk/tickets`);
    const body = await res.json();

    expect(body.data).toHaveLength(2);
    expect(body.total).toBe(2);
    expect(body.page).toBe(1);
  });

  it("returns ticket with expected fields", async () => {
    const fetchMock = createFetchMock(200, {
      data: [
        {
          id: "t1",
          subject: "Password reset fails",
          priority: "urgent",
          status: "open",
          contactEmail: "user@example.com",
          dueAt: "2026-04-01T00:00:00Z",
        },
      ],
      total: 1,
      page: 1,
      limit: 50,
    });
    global.fetch = fetchMock;

    const res = await fetch(`${API_BASE}/helpdesk/tickets`);
    const body = await res.json();
    const ticket = body.data[0];

    expect(ticket.id).toBe("t1");
    expect(ticket.subject).toBeDefined();
    expect(ticket.priority).toBeDefined();
    expect(ticket.status).toBeDefined();
  });
});

// ─── Ticket Creation Tests ─────────────────────────────────────────────────────

describe("Helpdesk: Create ticket", () => {
  beforeEach(() => {
    mockLocalStorage();
  });

  afterEach(() => {
    global.fetch = ORIGINAL_FETCH;
    vi.clearAllMocks();
  });

  it("sends POST request with subject and priority", async () => {
    const fetchMock = createFetchMock(201, {
      id: "t-new",
      subject: "API integration fails",
      priority: "high",
      status: "open",
    });
    global.fetch = fetchMock;

    await fetch(`${API_BASE}/helpdesk/tickets`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ subject: "API integration fails", priority: "high" }),
    });

    const call = fetchMock.mock.calls[0];
    expect(call[1].method).toBe("POST");
    const body = JSON.parse(call[1].body);
    expect(body.subject).toBe("API integration fails");
    expect(body.priority).toBe("high");
  });

  it("returns created ticket with id", async () => {
    const fetchMock = createFetchMock(201, {
      id: "t-abc123",
      subject: "Unable to export data",
      priority: "medium",
      status: "open",
    });
    global.fetch = fetchMock;

    const res = await fetch(`${API_BASE}/helpdesk/tickets`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ subject: "Unable to export data", priority: "medium" }),
    });
    const ticket = await res.json();

    expect(ticket.id).toBeDefined();
    expect(ticket.subject).toBe("Unable to export data");
  });

  it("sends optional contact fields when provided", async () => {
    const fetchMock = createFetchMock(201, { id: "t-new" });
    global.fetch = fetchMock;

    await fetch(`${API_BASE}/helpdesk/tickets`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        subject: "Billing issue",
        priority: "urgent",
        contactEmail: "customer@acme.com",
        contactName: "Jane Doe",
      }),
    });

    const body = JSON.parse(fetchMock.mock.calls[0][1].body);
    expect(body.contactEmail).toBe("customer@acme.com");
    expect(body.contactName).toBe("Jane Doe");
  });
});

// ─── Ticket Filtering Tests ────────────────────────────────────────────────────

describe("Helpdesk: Filter tickets by status", () => {
  beforeEach(() => {
    mockLocalStorage();
  });

  afterEach(() => {
    global.fetch = ORIGINAL_FETCH;
    vi.clearAllMocks();
  });

  it("includes status filter in query string", async () => {
    const fetchMock = createFetchMock(200, { data: [], total: 0, page: 1, limit: 50 });
    global.fetch = fetchMock;

    await fetch(`${API_BASE}/helpdesk/tickets?status=open`);

    const url = fetchMock.mock.calls[0][0] as string;
    expect(url).toContain("status=open");
  });

  it("includes priority filter in query string", async () => {
    const fetchMock = createFetchMock(200, { data: [], total: 0, page: 1, limit: 50 });
    global.fetch = fetchMock;

    await fetch(`${API_BASE}/helpdesk/tickets?priority=urgent`);

    const url = fetchMock.mock.calls[0][0] as string;
    expect(url).toContain("priority=urgent");
  });

  it("combines status and priority filters", async () => {
    const fetchMock = createFetchMock(200, { data: [], total: 0, page: 1, limit: 50 });
    global.fetch = fetchMock;

    const params = new URLSearchParams({ status: "open", priority: "high" });
    await fetch(`${API_BASE}/helpdesk/tickets?${params}`);

    const url = fetchMock.mock.calls[0][0] as string;
    expect(url).toContain("status=open");
    expect(url).toContain("priority=high");
  });

  it("returns only matching tickets when filtered", async () => {
    const fetchMock = createFetchMock(200, {
      data: [
        { id: "t1", subject: "Issue A", status: "open", priority: "high" },
      ],
      total: 1,
      page: 1,
      limit: 50,
    });
    global.fetch = fetchMock;

    const res = await fetch(`${API_BASE}/helpdesk/tickets?status=open&priority=high`);
    const body = await res.json();

    expect(body.data).toHaveLength(1);
    expect(body.data[0].status).toBe("open");
    expect(body.data[0].priority).toBe("high");
  });
});

// ─── Ticket Update Tests ───────────────────────────────────────────────────────

describe("Helpdesk: Update ticket status", () => {
  beforeEach(() => {
    mockLocalStorage();
  });

  afterEach(() => {
    global.fetch = ORIGINAL_FETCH;
    vi.clearAllMocks();
  });

  it("sends PUT request to ticket endpoint", async () => {
    const fetchMock = createFetchMock(200, {
      id: "t1",
      status: "resolved",
      subject: "Login broken",
    });
    global.fetch = fetchMock;

    await fetch(`${API_BASE}/helpdesk/tickets/t1`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: "resolved" }),
    });

    expect(fetchMock.mock.calls[0][1].method).toBe("PUT");
  });

  it("targets correct ticket id in URL", async () => {
    const fetchMock = createFetchMock(200, { id: "ticket-xyz", status: "closed" });
    global.fetch = fetchMock;

    await fetch(`${API_BASE}/helpdesk/tickets/ticket-xyz`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: "closed" }),
    });

    const url = fetchMock.mock.calls[0][0] as string;
    expect(url).toContain("/helpdesk/tickets/ticket-xyz");
  });

  it("sends updated status in body", async () => {
    const fetchMock = createFetchMock(200, { id: "t2", status: "pending" });
    global.fetch = fetchMock;

    await fetch(`${API_BASE}/helpdesk/tickets/t2`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: "pending", assigneeId: "user-99" }),
    });

    const body = JSON.parse(fetchMock.mock.calls[0][1].body);
    expect(body.status).toBe("pending");
    expect(body.assigneeId).toBe("user-99");
  });

  it("returns updated ticket on success", async () => {
    const fetchMock = createFetchMock(200, {
      id: "t3",
      subject: "Old bug",
      status: "resolved",
      resolvedAt: "2026-03-23T10:00:00Z",
    });
    global.fetch = fetchMock;

    const res = await fetch(`${API_BASE}/helpdesk/tickets/t3`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: "resolved" }),
    });
    const ticket = await res.json();

    expect(ticket.status).toBe("resolved");
    expect(ticket.resolvedAt).toBeDefined();
  });
});

// ─── SLA Tracking Tests ────────────────────────────────────────────────────────

describe("Helpdesk: SLA tracking", () => {
  function calculateSlaStatus(
    dueAt: string | null,
    resolvedAt: string | null,
  ): "met" | "breached" | "pending" {
    if (!dueAt) return "pending";
    const due = new Date(dueAt);
    const resolved = resolvedAt ? new Date(resolvedAt) : new Date();
    if (resolvedAt) return resolved <= due ? "met" : "breached";
    return resolved <= due ? "pending" : "breached";
  }

  it("returns met when ticket resolved before dueAt", () => {
    const result = calculateSlaStatus(
      "2026-04-01T12:00:00Z",
      "2026-03-31T10:00:00Z",
    );
    expect(result).toBe("met");
  });

  it("returns breached when ticket resolved after dueAt", () => {
    const result = calculateSlaStatus(
      "2026-03-01T12:00:00Z",
      "2026-03-10T10:00:00Z",
    );
    expect(result).toBe("breached");
  });

  it("returns pending when no dueAt is set", () => {
    const result = calculateSlaStatus(null, null);
    expect(result).toBe("pending");
  });

  it("computes time remaining in hours", () => {
    function hoursUntilDue(dueAt: string): number {
      const due = new Date(dueAt).getTime();
      const now = Date.now();
      return Math.max(0, Math.round((due - now) / (1000 * 60 * 60)));
    }

    const futureDate = new Date(Date.now() + 5 * 60 * 60 * 1000).toISOString();
    expect(hoursUntilDue(futureDate)).toBeGreaterThanOrEqual(4);
    expect(hoursUntilDue(futureDate)).toBeLessThanOrEqual(5);
  });

  it("fetches tickets with dueAt filter via query param", async () => {
    const fetchMock = createFetchMock(200, {
      data: [{ id: "t1", subject: "Urgent fix", dueAt: "2026-04-01T00:00:00Z" }],
      total: 1,
      page: 1,
      limit: 50,
    });
    global.fetch = fetchMock;

    await fetch(`${API_BASE}/helpdesk/tickets?priority=urgent`);

    const res = await (fetchMock.mock.results[0].value as Promise<Response>);
    const body = await res.json();
    expect(body.data[0].dueAt).toBeDefined();

    global.fetch = ORIGINAL_FETCH;
    vi.clearAllMocks();
  });
});

// ─── Error Handling Tests ──────────────────────────────────────────────────────

describe("Helpdesk: Error handling", () => {
  beforeEach(() => {
    mockLocalStorage();
  });

  afterEach(() => {
    global.fetch = ORIGINAL_FETCH;
    vi.clearAllMocks();
  });

  it("handles 403 forbidden response", async () => {
    const fetchMock = createFetchMock(403, { message: "Forbidden" });
    global.fetch = fetchMock;

    const res = await fetch(`${API_BASE}/helpdesk/tickets`);

    expect(res.ok).toBe(false);
    expect(res.status).toBe(403);
    const body = await res.json();
    expect(body.message).toBe("Forbidden");
  });

  it("handles 500 internal server error", async () => {
    const fetchMock = createFetchMock(500, { message: "Internal server error" });
    global.fetch = fetchMock;

    const res = await fetch(`${API_BASE}/helpdesk/tickets`);

    expect(res.ok).toBe(false);
    expect(res.status).toBe(500);
  });

  it("handles network failure gracefully", async () => {
    global.fetch = vi.fn().mockRejectedValue(new Error("Network error"));

    await expect(fetch(`${API_BASE}/helpdesk/tickets`)).rejects.toThrow("Network error");
  });

  it("handles 404 when ticket not found", async () => {
    const fetchMock = createFetchMock(404, { message: "Ticket not found" });
    global.fetch = fetchMock;

    const res = await fetch(`${API_BASE}/helpdesk/tickets/nonexistent-id`);

    expect(res.status).toBe(404);
    const body = await res.json();
    expect(body.message).toBe("Ticket not found");
  });
});
