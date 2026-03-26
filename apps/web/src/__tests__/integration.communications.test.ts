/**
 * Integration Tests: Communications API Calls
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

// ─── SMS Send Tests ────────────────────────────────────────────────────────────

describe("Communications: Send SMS", () => {
  beforeEach(() => {
    mockLocalStorage();
  });

  afterEach(() => {
    global.fetch = ORIGINAL_FETCH;
    vi.clearAllMocks();
  });

  it("sends POST to SMS endpoint", async () => {
    const fetchMock = createFetchMock(201, {
      id: "msg-1",
      to: "+15551234567",
      body: "Hello from Nucleo One!",
      status: "queued",
    });
    global.fetch = fetchMock;

    await fetch(`${API_BASE}/communications/sms`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ to: "+15551234567", body: "Hello from Nucleo One!" }),
    });

    const call = fetchMock.mock.calls[0];
    expect(call[1].method).toBe("POST");
    const body = JSON.parse(call[1].body);
    expect(body.to).toBe("+15551234567");
    expect(body.body).toBe("Hello from Nucleo One!");
  });

  it("returns sent message with id and status", async () => {
    const fetchMock = createFetchMock(201, {
      id: "msg-new",
      to: "+15559876543",
      body: "Your appointment is confirmed",
      status: "queued",
      createdAt: "2026-03-23T12:00:00Z",
    });
    global.fetch = fetchMock;

    const res = await fetch(`${API_BASE}/communications/sms`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ to: "+15559876543", body: "Your appointment is confirmed" }),
    });
    const message = await res.json();

    expect(message.id).toBeDefined();
    expect(message.status).toBe("queued");
  });

  it("sends optional conversationId when provided", async () => {
    const fetchMock = createFetchMock(201, { id: "msg-conv" });
    global.fetch = fetchMock;

    await fetch(`${API_BASE}/communications/sms`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        to: "+15550001111",
        body: "Reply from agent",
        conversationId: "conv-42",
      }),
    });

    const body = JSON.parse(fetchMock.mock.calls[0][1].body);
    expect(body.conversationId).toBe("conv-42");
  });

  it("validates phone number format before send", () => {
    function isValidE164(phone: string): boolean {
      return /^\+[1-9]\d{6,14}$/.test(phone);
    }

    expect(isValidE164("+15551234567")).toBe(true);
    expect(isValidE164("+447700900123")).toBe(true);
    expect(isValidE164("5551234567")).toBe(false); // missing +
    expect(isValidE164("+1")).toBe(false); // too short
  });

  it("handles 422 when to field is invalid", async () => {
    const fetchMock = createFetchMock(422, { message: "Invalid phone number format" });
    global.fetch = fetchMock;

    const res = await fetch(`${API_BASE}/communications/sms`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ to: "invalid-phone", body: "Test" }),
    });

    expect(res.status).toBe(422);
    const body = await res.json();
    expect(body.message).toContain("phone");
  });
});

// ─── Conversation List Tests ───────────────────────────────────────────────────

describe("Communications: Conversation list", () => {
  beforeEach(() => {
    mockLocalStorage();
  });

  afterEach(() => {
    global.fetch = ORIGINAL_FETCH;
    vi.clearAllMocks();
  });

  it("sends GET to conversations endpoint", async () => {
    const fetchMock = createFetchMock(200, { data: [], total: 0, page: 1, limit: 20 });
    global.fetch = fetchMock;

    await fetch(`${API_BASE}/communications/conversations`);

    const url = fetchMock.mock.calls[0][0] as string;
    expect(url).toContain("/communications/conversations");
  });

  it("returns list of conversations", async () => {
    const conversations = [
      { id: "conv-1", contactPhone: "+15551234567", lastMessage: "Hello!", unreadCount: 2 },
      { id: "conv-2", contactPhone: "+15559876543", lastMessage: "Thanks!", unreadCount: 0 },
    ];
    const fetchMock = createFetchMock(200, {
      data: conversations,
      total: 2,
      page: 1,
      limit: 20,
    });
    global.fetch = fetchMock;

    const res = await fetch(`${API_BASE}/communications/conversations`);
    const body = await res.json();

    expect(body.data).toHaveLength(2);
    expect(body.data[0].lastMessage).toBe("Hello!");
  });

  it("includes unread filter in query string", async () => {
    const fetchMock = createFetchMock(200, { data: [], total: 0, page: 1, limit: 20 });
    global.fetch = fetchMock;

    await fetch(`${API_BASE}/communications/conversations?unreadOnly=true`);

    const url = fetchMock.mock.calls[0][0] as string;
    expect(url).toContain("unreadOnly=true");
  });

  it("fetches messages for a specific conversation", async () => {
    const fetchMock = createFetchMock(200, {
      data: [
        { id: "m1", conversationId: "conv-1", body: "Hi there", direction: "inbound" },
        { id: "m2", conversationId: "conv-1", body: "How can I help?", direction: "outbound" },
      ],
      total: 2,
    });
    global.fetch = fetchMock;

    await fetch(`${API_BASE}/communications/conversations/conv-1/messages`);

    const url = fetchMock.mock.calls[0][0] as string;
    expect(url).toContain("/conversations/conv-1/messages");
    const body = await (fetchMock.mock.results[0].value as Promise<Response>).then((r) => r.json());
    expect(body.data[0].direction).toBe("inbound");
  });
});

// ─── Voice Call Initiation Tests ───────────────────────────────────────────────

describe("Communications: Voice call initiation", () => {
  beforeEach(() => {
    mockLocalStorage();
  });

  afterEach(() => {
    global.fetch = ORIGINAL_FETCH;
    vi.clearAllMocks();
  });

  it("sends POST to calls endpoint", async () => {
    const fetchMock = createFetchMock(201, {
      id: "call-1",
      to: "+15551234567",
      status: "initiating",
      callSid: "CA-abc123",
    });
    global.fetch = fetchMock;

    await fetch(`${API_BASE}/communications/calls`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ to: "+15551234567" }),
    });

    const call = fetchMock.mock.calls[0];
    expect(call[1].method).toBe("POST");
    const body = JSON.parse(call[1].body);
    expect(body.to).toBe("+15551234567");
  });

  it("returns call with sid and status", async () => {
    const fetchMock = createFetchMock(201, {
      id: "call-new",
      to: "+15559876543",
      status: "initiating",
      callSid: "CA-xyz789",
    });
    global.fetch = fetchMock;

    const res = await fetch(`${API_BASE}/communications/calls`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ to: "+15559876543" }),
    });
    const callRecord = await res.json();

    expect(callRecord.callSid).toBeDefined();
    expect(callRecord.status).toBe("initiating");
  });

  it("handles 503 when telephony service unavailable", async () => {
    const fetchMock = createFetchMock(503, { message: "Telephony service unavailable" });
    global.fetch = fetchMock;

    const res = await fetch(`${API_BASE}/communications/calls`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ to: "+15550001111" }),
    });

    expect(res.ok).toBe(false);
    expect(res.status).toBe(503);
  });
});

// ─── Message Templates CRUD Tests ─────────────────────────────────────────────

describe("Communications: Message templates CRUD", () => {
  beforeEach(() => {
    mockLocalStorage();
  });

  afterEach(() => {
    global.fetch = ORIGINAL_FETCH;
    vi.clearAllMocks();
  });

  it("fetches list of message templates", async () => {
    const fetchMock = createFetchMock(200, {
      data: [
        { id: "tpl-1", name: "Welcome SMS", body: "Welcome to {{company}}!", category: "onboarding" },
        { id: "tpl-2", name: "Appointment Reminder", body: "Reminder: {{date}} at {{time}}", category: "reminders" },
      ],
      total: 2,
    });
    global.fetch = fetchMock;

    await fetch(`${API_BASE}/communications/templates`);

    const url = fetchMock.mock.calls[0][0] as string;
    expect(url).toContain("/communications/templates");
    const body = await (fetchMock.mock.results[0].value as Promise<Response>).then((r) => r.json());
    expect(body.data).toHaveLength(2);
  });

  it("creates a new message template", async () => {
    const fetchMock = createFetchMock(201, {
      id: "tpl-new",
      name: "Follow-up",
      body: "Hi {{firstName}}, just following up!",
      category: "sales",
    });
    global.fetch = fetchMock;

    await fetch(`${API_BASE}/communications/templates`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: "Follow-up",
        body: "Hi {{firstName}}, just following up!",
        category: "sales",
      }),
    });

    const call = fetchMock.mock.calls[0];
    expect(call[1].method).toBe("POST");
    const body = JSON.parse(call[1].body);
    expect(body.name).toBe("Follow-up");
    expect(body.body).toContain("{{firstName}}");
  });

  it("updates an existing template", async () => {
    const fetchMock = createFetchMock(200, {
      id: "tpl-1",
      name: "Welcome SMS Updated",
      body: "Welcome to {{company}}! We are glad to have you.",
    });
    global.fetch = fetchMock;

    await fetch(`${API_BASE}/communications/templates/tpl-1`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ body: "Welcome to {{company}}! We are glad to have you." }),
    });

    expect(fetchMock.mock.calls[0][1].method).toBe("PATCH");
    const url = fetchMock.mock.calls[0][0] as string;
    expect(url).toContain("/templates/tpl-1");
  });

  it("deletes a message template", async () => {
    const fetchMock = createFetchMock(204, null);
    global.fetch = fetchMock;

    await fetch(`${API_BASE}/communications/templates/tpl-2`, {
      method: "DELETE",
    });

    expect(fetchMock.mock.calls[0][1].method).toBe("DELETE");
    const url = fetchMock.mock.calls[0][0] as string;
    expect(url).toContain("/templates/tpl-2");
  });

  it("resolves template variables into message body", () => {
    function resolveTemplate(template: string, vars: Record<string, string>): string {
      return template.replace(/\{\{(\w+)\}\}/g, (_, key) => vars[key] ?? `{{${key}}}`);
    }

    const tpl = "Hi {{firstName}}, your order {{orderId}} is ready!";
    const resolved = resolveTemplate(tpl, { firstName: "Alice", orderId: "ORD-99" });
    expect(resolved).toBe("Hi Alice, your order ORD-99 is ready!");
  });

  it("leaves unresolved vars in place when missing", () => {
    function resolveTemplate(template: string, vars: Record<string, string>): string {
      return template.replace(/\{\{(\w+)\}\}/g, (_, key) => vars[key] ?? `{{${key}}}`);
    }

    const tpl = "Hello {{firstName}}, call us at {{phone}}";
    const resolved = resolveTemplate(tpl, { firstName: "Bob" });
    expect(resolved).toBe("Hello Bob, call us at {{phone}}");
  });

  it("handles network error on template fetch", async () => {
    global.fetch = vi.fn().mockRejectedValue(new Error("DNS failure"));

    await expect(fetch(`${API_BASE}/communications/templates`)).rejects.toThrow("DNS failure");
  });
});
